import { NextResponse, type NextRequest } from "next/server";
import { isOriginAllowed } from "@/lib/security";
import { checkTrackingRateLimit } from "@/lib/ratelimit";
import { type AduanPublicTrack } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // 1. Origin Guard
  if (!isOriginAllowed(request)) {
    console.warn(JSON.stringify({
      log_type: "[ORIGIN GUARD]",
      allowed: false,
      endpoint: "cek-tiket",
      originPresent: !!request.headers.get("origin")
    }));
    return NextResponse.json(
      { success: false, code: "FORBIDDEN", message: "Permintaan ditolak. Akses tidak sah." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  // 2. IP Rate Limiter
  const rlResult = await checkTrackingRateLimit(request);
  if (!rlResult.allowed) {
    if (rlResult.reason === "rate_limited") {
      return NextResponse.json(
        { success: false, code: "RATE_LIMITED", message: "Batas pengecekan tiket telah tercapai. Silakan coba kembali beberapa saat lagi." },
        {
          status: 429,
          headers: {
            "Retry-After": rlResult.retryAfter.toString(),
            "X-RateLimit-Limit": rlResult.limit.toString(),
            "X-RateLimit-Reset": rlResult.reset.toString(),
            "Cache-Control": "no-store"
          },
        }
      );
    }
    return NextResponse.json(
      { success: false, code: "SERVICE_UNAVAILABLE", message: "Layanan sedang tidak tersedia. Silakan coba lagi nanti." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  // 3. Parse Body
  let body: { ticket?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, code: "BAD_REQUEST", message: "Permintaan tidak valid." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { ticket } = body;
  if (!ticket || typeof ticket !== "string" || ticket.length > 50) {
    return NextResponse.json(
      { success: false, code: "BAD_REQUEST", message: "Nomor tiket tidak valid." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // 4. Validate Ticket Format
  const ticketRegex = /^TKT-\d{6}-[A-Z0-9]{4}$/;
  if (!ticketRegex.test(ticket.trim())) {
    return NextResponse.json(
      { success: false, code: "BAD_REQUEST", message: "Nomor tiket tidak valid. Silakan periksa kembali nomor tiket Anda." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("get_aduan_by_ticket", { p_ticket_number: ticket.trim() })
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found: PGRST116 indicates 0 rows returned
        return NextResponse.json(
          { success: false, code: "NOT_FOUND", message: "Nomor tiket tidak ditemukan." },
          { status: 404, headers: { "Cache-Control": "no-store" } }
        );
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { success: false, code: "NOT_FOUND", message: "Nomor tiket tidak ditemukan." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 6. Sanitize response
    const aduanData = data as AduanPublicTrack;
    const sanitizedResponse: AduanPublicTrack = {
      ticket_number: aduanData.ticket_number,
      classification: aduanData.classification,
      title: aduanData.title,
      status: aduanData.status,
      response: aduanData.response,
      created_at: aduanData.created_at,
      updated_at: aduanData.updated_at,
    };

    return NextResponse.json(
      { success: true, data: sanitizedResponse },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );

  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as Record<string, unknown>).message)
        : String(err);

    const errorCode =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as Record<string, unknown>).code)
        : undefined;

    console.error(JSON.stringify({
      log_type: "[TRACKING ERROR]",
      error: errorMessage,
      code: errorCode,
      ticket: ticket.trim(),
    }));

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Terjadi gangguan sistem. Layanan sedang mengalami kendala, silakan coba beberapa saat lagi."
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
