export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAGIC_BYTES: Array<{ mime: string; bytes: number[] }> = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: [0x50, 0x4B, 0x03, 0x04] }, // PK.. (OOXML/ZIP)
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] }, // .PNG
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (+ WEBP at offset 8)
];

export function sanitizeFilename(raw: string): string {
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

export function detectMimeFromMagicBytes(buffer: Uint8Array): string | null {
  for (const sig of MAGIC_BYTES) {
    if (buffer.length < sig.bytes.length) continue;
    const match = sig.bytes.every((b, i) => buffer[i] === b);
    if (match) {
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
        continue;
      }
      return sig.mime;
    }
  }
  return null;
}
