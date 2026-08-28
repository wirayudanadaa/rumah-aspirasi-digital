import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTicketNumber } from "@/lib/utils";
import { randomUUID } from "crypto";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const VALID_CLASSIFICATIONS = new Set([
  "PENGADUAN",
  "ASPIRASI",
  "PERMINTAAN_INFORMASI",
]);

/**
 * Known magic-byte signatures for allowed file types.
 * Checked against the first N bytes of the file buffer.
 */
const MAGIC_BYTES: Array<{ mime: string; bytes: number[] }> = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] }, // .PNG
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (+ WEBP at offset 8)
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeFilename(raw: string): string {
  // Take the basename only (strip path)
  const basename = raw.split(/[\\/]/).pop() ?? raw;

  // Replace non-safe characters with underscores; keep alphanumeric, dot, dash
  const cleaned = basename
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();

  // Limit length to 80 characters
  if (cleaned.length > 80) {
    const ext = cleaned.lastIndexOf(".");
    if (ext > 0) {
      const extension = cleaned.slice(ext);
      return cleaned.slice(0, 80 - extension.length) + extension;
    }
    return cleaned.slice(0, 80);
  }

  return cleaned || "unnamed";
}

function detectMimeFromMagicBytes(buffer: Uint8Array): string | null {
  for (const sig of MAGIC_BYTES) {
    if (buffer.length < sig.bytes.length) continue;
    const match = sig.bytes.every((b, i) => buffer[i] === b);
    if (match) {
      // Special check for WebP: after RIFF header, offset 8-11 should be WEBP
      if (sig.mime === "image/webp") {
        if (
          buffer.length >= 12 &&
          buffer[8] === 0x57 && // W
          buffer[9] === 0x45 && // E
          buffer[10] === 0x42 && // B
          buffer[11] === 0x50 // P
        ) {
          return "image/webp";
        }
        continue; // RIFF but not WEBP — skip
      }
      return sig.mime;
    }
  }
  return null;
}

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubmitSuccess {
  success: true;
  ticketNumber: string;
  attachmentUploaded: boolean;
  warning?: string;
}

interface SubmitError {
  success: false;
  message: string;
}

type SubmitResponse = SubmitSuccess | SubmitError;

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse<SubmitResponse>> {
  // ── 1. Parse multipart/form-data ───────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, message: "Format request tidak valid. Gunakan multipart/form-data." },
      { status: 400 }
    );
  }

  // ── 2. Extract & validate text fields ──────────────────────────────────────
  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();
  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();

  if (!name || !email || !title || !description) {
    return NextResponse.json(
      { success: false, message: "Field wajib (name, email, title, description) harus diisi." },
      { status: 400 }
    );
  }

  // Classification
  const classificationRaw = (formData.get("classification") as string | null)?.trim() ?? "PENGADUAN";
  if (!VALID_CLASSIFICATIONS.has(classificationRaw)) {
    return NextResponse.json(
      { success: false, message: "Klasifikasi tidak valid." },
      { status: 400 }
    );
  }

  // Optional fields
  const dateOfIncident = (formData.get("date_of_incident") as string | null)?.trim() || null;
  const location = (formData.get("location") as string | null)?.trim() || null;
  const institution = (formData.get("institution") as string | null)?.trim() || null;
  const category = (formData.get("category") as string | null)?.trim() || null;
  const isAnonymous = formData.get("is_anonymous") === "true";
  const isSecret = formData.get("is_secret") === "true";

  // ── 3. Extract & validate file (optional) ──────────────────────────────────
  const file = formData.get("attachment");
  let validFile: File | null = null;
  let fileBuffer: Uint8Array | null = null;

  if (file && file instanceof File && file.size > 0) {
    // Check file count — only 1 allowed
    const allFiles = formData.getAll("attachment");
    if (allFiles.length > 1) {
      return NextResponse.json(
        { success: false, message: "Maksimum 1 file lampiran." },
        { status: 400 }
      );
    }

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `Ukuran file melebihi batas 2 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).` },
        { status: 400 }
      );
    }

    // MIME check (browser-provided)
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, message: `Tipe file "${file.type}" tidak diizinkan. Gunakan PDF, JPG, PNG, atau WebP.` },
        { status: 400 }
      );
    }

    // Read file bytes for magic byte validation
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = new Uint8Array(arrayBuffer);

    // Magic byte verification
    const detectedMime = detectMimeFromMagicBytes(fileBuffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
      return NextResponse.json(
        {
          success: false,
          message: "Konten file tidak sesuai dengan tipe yang diizinkan. File mungkin rusak atau disamarkan.",
        },
        { status: 400 }
      );
    }

    // Cross-check: browser MIME should match magic-byte detected MIME
    // Allow jpeg variants: image/jpeg covers both
    if (detectedMime !== file.type) {
      return NextResponse.json(
        {
          success: false,
          message: "Ekstensi file tidak cocok dengan isi file. Periksa kembali file yang diunggah.",
        },
        { status: 400 }
      );
    }

    validFile = file;
  }

  // ── 4. Create admin client ─────────────────────────────────────────────────
  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (err: unknown) {
    console.error("[ADMIN CLIENT ERROR]", safeErrorMessage(err));
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan konfigurasi server." },
      { status: 500 }
    );
  }

  // ── 5. Generate ticket number ──────────────────────────────────────────────
  const ticketNumber = generateTicketNumber();

  // ── 6. INSERT aduan ────────────────────────────────────────────────────────
  const { data: aduanData, error: aduanError } = await adminClient
    .from("aduan")
    .insert([
      {
        ticket_number: ticketNumber,
        classification: classificationRaw,
        name,
        email,
        title,
        description,
        date_of_incident: dateOfIncident,
        location,
        institution,
        category,
        is_anonymous: isAnonymous,
        is_secret: isSecret,
        // status defaults to PENDING in database
        // response defaults to NULL in database
      },
    ])
    .select("id")
    .single();

  if (aduanError || !aduanData) {
    console.error("[ADUAN INSERT ERROR]", {
      code: aduanError?.code,
      message: aduanError?.message,
    });
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan laporan. Silakan coba lagi." },
      { status: 500 }
    );
  }

  const aduanId: string = aduanData.id;

  // ── 7. Upload file to Storage (if attachment exists) ───────────────────────
  let attachmentUploaded = false;
  let attachmentWarning: string | undefined;

  if (validFile && fileBuffer) {
    const fileUuid = randomUUID();
    const safeName = sanitizeFilename(validFile.name);
    const storagePath = `aduan/${aduanId}/${fileUuid}-${safeName}`;

    const { error: uploadError } = await adminClient.storage
      .from("attachments")
      .upload(storagePath, fileBuffer, {
        contentType: validFile.type,
        upsert: false,
      });

    if (uploadError) {
      // Case C: Aduan saved, upload failed → aduan remains, return warning
      console.error("[STORAGE UPLOAD ERROR]", {
        message: uploadError.message,
      });
      attachmentWarning =
        "Laporan berhasil disimpan, namun lampiran gagal diunggah karena gangguan sistem. Lampiran dapat dikirim ulang nanti.";
    } else {
      // ── 8. INSERT attachment metadata ────────────────────────────────────
      const { error: metaError } = await adminClient
        .from("aduan_attachments")
        .insert([
          {
            aduan_id: aduanId,
            file_name: safeName,
            storage_path: storagePath,
            mime_type: validFile.type,
            file_size: validFile.size,
            // created_at defaults to now() in database
          },
        ]);

      if (metaError) {
        // Case D: Upload succeeded, metadata failed → delete orphan object
        console.error("[METADATA INSERT ERROR]", {
          code: metaError.code,
          message: metaError.message,
        });

        // Cleanup orphan file
        const { error: cleanupError } = await adminClient.storage
          .from("attachments")
          .remove([storagePath]);

        if (cleanupError) {
          console.error("[ORPHAN CLEANUP ERROR]", {
            path: storagePath,
            message: cleanupError.message,
          });
        }

        attachmentWarning =
          "Laporan berhasil disimpan, namun metadata lampiran gagal dicatat. Lampiran mungkin perlu dikirim ulang.";
      } else {
        attachmentUploaded = true;
      }
    }
  }

  // ── 9. Return success ──────────────────────────────────────────────────────
  const response: SubmitSuccess = {
    success: true,
    ticketNumber,
    attachmentUploaded,
  };

  if (attachmentWarning) {
    response.warning = attachmentWarning;
  }

  return NextResponse.json(response, { status: 201 });
}
