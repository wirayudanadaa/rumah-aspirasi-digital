import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";
import { 
  MAX_FILE_SIZE, 
  ALLOWED_MIME_TYPES, 
  sanitizeFilename, 
  detectMimeFromMagicBytes 
} from "@/lib/fileValidation";

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: aduanId } = await params;
    if (!aduanId) {
      return NextResponse.json({ success: false, message: "ID Aduan tidak valid." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Tidak terautentikasi." }, { status: 401 });
    }

    // Verify if user is admin
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { target_user_id: user.id });
    if (rpcError || !isAdmin) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("attachment");

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, message: "File lampiran tidak ditemukan atau kosong." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `Ukuran file melebihi batas 2 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, message: "Format file tidak didukung." }, { status: 400 });
    }

    const fileBuffer = new Uint8Array(await file.arrayBuffer());
    const detectedMime = detectMimeFromMagicBytes(fileBuffer);
    if (!detectedMime || detectedMime !== file.type) {
      console.warn("[ADMIN ATTACHMENT UPLOAD GUARD] MIME mismatch or undetected.", { browserMime: file.type, magicMime: detectedMime });
      return NextResponse.json({ success: false, message: "Format file tidak valid (MIME mismatch)." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Verify aduan exists
    const { data: aduanData, error: aduanError } = await adminClient
      .from("aduan")
      .select("id")
      .eq("id", aduanId)
      .single();

    if (aduanError || !aduanData) {
      return NextResponse.json({ success: false, message: "Aduan tidak ditemukan." }, { status: 404 });
    }

    const fileUuid = randomUUID();
    const safeName = sanitizeFilename(file.name);
    // Explicitly path it under /admin/ to differentiate from citizen uploads
    const storagePath = `aduan/${aduanId}/admin/${fileUuid}-${safeName}`;

    const { error: uploadError } = await adminClient.storage
      .from("attachments")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[ADMIN STORAGE UPLOAD ERROR]", uploadError);
      return NextResponse.json({ success: false, message: "Upload gagal. Silakan coba lagi." }, { status: 500 });
    }

    const { error: metaError } = await adminClient
      .from("aduan_attachments")
      .insert([
        {
          aduan_id: aduanId,
          file_name: safeName,
          storage_path: storagePath,
          mime_type: file.type,
          file_size: file.size,
        },
      ]);

    if (metaError) {
      console.error("[ADMIN METADATA INSERT ERROR]", metaError);
      // Orphan cleanup
      await adminClient.storage.from("attachments").remove([storagePath]);
      return NextResponse.json({ success: false, message: "Gagal menyimpan metadata lampiran." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Lampiran berhasil diunggah." });

  } catch (error) {
    console.error("[ADMIN ATTACHMENT ERROR]", safeErrorMessage(error));
    return NextResponse.json({ success: false, message: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
