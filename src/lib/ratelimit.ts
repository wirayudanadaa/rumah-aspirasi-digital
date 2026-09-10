/**
 * Server-side IP rate limiting using Upstash Redis + @upstash/ratelimit.
 *
 * This module is SERVER-ONLY.
 * Never import from client components.
 *
 * Environment variables consumed (server-only):
 *   UPSTASH_REDIS_REST_URL   — Upstash Redis REST endpoint
 *   UPSTASH_REDIS_REST_TOKEN — Upstash Redis REST token
 *   RATE_LIMIT_SALT          — Secret salt for one-way IP hashing
 *
 * Design decisions:
 *   - Sliding Window algorithm prevents burst attacks at window boundaries.
 *   - Client identifier = SHA-256(clientIP + salt).substring(0, 16)
 *     → Non-reversible, short, anonymous, ephemeral.
 *   - Redis key namespace: rad:rl:aduan:{hashed_identifier}
 *   - TTL is managed automatically by @upstash/ratelimit (600s window).
 *   - Fail-closed: if Redis is unavailable, limiter returns an error sentinel
 *     and the caller must reject the request with HTTP 503.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "crypto";
import { type NextRequest } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "rate_limited"; retryAfter: number; limit: number; reset: number }
  | { allowed: false; reason: "service_unavailable" };

// ─── Redis & Limiter Singleton ────────────────────────────────────────────────
// Initialised lazily so that builds/SSG don't fail when env vars are absent.

let redisClient: Redis | null = null;
let aduanLimiter: Ratelimit | null = null;
let trackingLimiter: Ratelimit | null = null;

function getAduanLimiter(): Ratelimit | null {
  if (aduanLimiter) return aduanLimiter;

  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(JSON.stringify({ log_type: "[RATE LIMIT]", event: "redis_not_configured" }));
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }

  aduanLimiter = new Ratelimit({
    redis: redisClient,
    // Sliding Window: 5 requests per 10-minute window.
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    // Prefix ensures isolation from any other Upstash usage.
    prefix: "rad:rl:aduan",
    analytics: false,
  });

  return aduanLimiter;
}

function getTrackingLimiter(): Ratelimit | null {
  if (trackingLimiter) return trackingLimiter;

  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(JSON.stringify({ log_type: "[RATE LIMIT]", event: "redis_not_configured" }));
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }

  trackingLimiter = new Ratelimit({
    redis: redisClient,
    // Sliding Window: 20 requests per 5-minute window.
    limiter: Ratelimit.slidingWindow(20, "5 m"),
    prefix: "rad:rl:track",
    analytics: false,
  });

  return trackingLimiter;
}

// ─── Client Identifier ────────────────────────────────────────────────────────

/**
 * Extracts the trusted client IP from the request.
 *
 * Header selection rationale:
 *   - `x-forwarded-for`: Vercel Edge populates this with the real client IP as the
 *     first value. Subsequent proxies may append to the list.
 *   - We take ONLY the first IP to avoid header-injection attacks where a malicious
 *     client supplies a forged IP in a second x-forwarded-for position.
 *   - `x-real-ip`: Fallback provided by some reverse proxies.
 *   - Final fallback: "unknown" — the rate limit will still apply to a shared "unknown"
 *     bucket, which is acceptable as a last resort.
 *
 * We do NOT trust arbitrary headers like `cf-connecting-ip` unless explicitly
 * confirmed to be injected by the edge layer.
 */
function extractClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // Take the first (leftmost) value — that is the actual client IP on Vercel.
    const first = xForwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "unknown";
}

/**
 * Returns a one-way HMAC-style hash of the client IP.
 * Uses SHA-256(rawIp + ":" + salt), truncated to 16 hex chars.
 *
 * Properties:
 *   - Non-reversible: cannot recover raw IP from the hash.
 *   - Deterministic: same IP + salt → same identifier.
 *   - Short: 16-char hex prefix reduces Redis key size.
 *   - Salt-protected: without the server secret, pre-computation tables fail.
 */
function hashIdentifier(rawIp: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? "";
  return createHash("sha256")
    .update(`${rawIp}:${salt}`)
    .digest("hex")
    .substring(0, 16);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Checks whether the request is within the rate limit for POST /api/aduan.
 * Never logs raw IP.
 */
export async function checkAduanRateLimit(
  request: NextRequest
): Promise<RateLimitResult> {
  const limiter = getAduanLimiter();

  if (!limiter) {
    // Redis not configured → fail-closed (treat as service unavailable).
    return { allowed: false, reason: "service_unavailable" };
  }

  const rawIp = extractClientIp(request);
  const identifier = hashIdentifier(rawIp);

  try {
    const result = await limiter.limit(identifier);

    if (result.success) {
      return { allowed: true };
    }

    // `result.reset` is a Unix timestamp (milliseconds) when the window resets.
    const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000);

    console.warn(
      JSON.stringify({
        log_type: "[RATE LIMIT]",
        event: "rate_limited",
        // Log only anonymous hashed identifier, never raw IP.
        identifierPrefix: identifier.substring(0, 8),
        limit: result.limit,
        remaining: result.remaining,
      })
    );

    return {
      allowed: false,
      reason: "rate_limited",
      retryAfter: Math.max(0, retryAfterSeconds),
      limit: result.limit,
      reset: result.reset,
    };
  } catch (err) {
    console.warn(
      JSON.stringify({
        log_type: "[RATE LIMIT]",
        event: "redis_error",
        error: err instanceof Error ? err.message : "unknown",
      })
    );
    // Redis runtime error → fail-closed.
    return { allowed: false, reason: "service_unavailable" };
  }
}

/**
 * Checks whether the request is within the rate limit for ticket tracking.
 */
export async function checkTrackingRateLimit(
  request: NextRequest
): Promise<RateLimitResult> {
  const limiter = getTrackingLimiter();

  if (!limiter) {
    // Redis not configured → fail-closed
    return { allowed: false, reason: "service_unavailable" };
  }

  const rawIp = extractClientIp(request);
  const identifier = hashIdentifier(rawIp);

  try {
    const result = await limiter.limit(identifier);

    if (result.success) {
      return { allowed: true };
    }

    const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000);

    console.warn(
      JSON.stringify({
        log_type: "[RATE LIMIT]",
        event: "rate_limited",
        identifierPrefix: identifier.substring(0, 8),
        endpoint: "track",
        limit: result.limit,
        remaining: result.remaining,
      })
    );

    return {
      allowed: false,
      reason: "rate_limited",
      retryAfter: Math.max(0, retryAfterSeconds),
      limit: result.limit,
      reset: result.reset,
    };
  } catch (err) {
    console.warn(
      JSON.stringify({
        log_type: "[RATE LIMIT]",
        event: "redis_error",
        endpoint: "track",
        error: err instanceof Error ? err.message : "unknown",
      })
    );
    return { allowed: false, reason: "service_unavailable" };
  }
}
