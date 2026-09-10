/**
 * Server-side Cloudflare Turnstile verification utility.
 *
 * This module is SERVER-ONLY.
 * It must never be imported from client components.
 *
 * Environment variables consumed:
 *   TURNSTILE_SECRET_KEY — server-only secret. Never logged. Never returned to client.
 */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

export type TurnstileVerifyResult =
  | { success: true }
  | { success: false; reason: "missing_token" | "invalid_token" | "service_unavailable" };

/**
 * Verifies a Cloudflare Turnstile token server-side.
 *
 * Does NOT send `remoteip` in this milestone (deferred to later hardening).
 * Does NOT log the token or the secret key.
 * On network timeout or Cloudflare error: returns service_unavailable
 * (fail-safe: caller returns controlled 503 — no DB write, no Storage upload).
 */
export async function verifyTurnstileToken(
  token: string | null | undefined
): Promise<TurnstileVerifyResult> {
  if (!token || token.trim() === "") {
    return { success: false, reason: "missing_token" };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // In development with no env var set, surface as unavailable rather than silently passing.
    console.warn(
      JSON.stringify({ log_type: "[TURNSTILE]", event: "secret_not_configured" })
    );
    return { success: false, reason: "service_unavailable" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(
        JSON.stringify({ log_type: "[TURNSTILE]", event: "siteverify_http_error", status: res.status })
      );
      return { success: false, reason: "service_unavailable" };
    }

    const data = (await res.json()) as { success: boolean };

    console.info(
      JSON.stringify({
        log_type: "[TURNSTILE]",
        verificationSuccess: data.success,
        // Do NOT log token or secret
      })
    );

    if (data.success === true) {
      return { success: true };
    }
    return { success: false, reason: "invalid_token" };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.warn(
      JSON.stringify({
        log_type: "[TURNSTILE]",
        event: isAbort ? "timeout" : "network_error",
      })
    );
    return { success: false, reason: "service_unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
