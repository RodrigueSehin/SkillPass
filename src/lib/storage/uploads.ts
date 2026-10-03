import { AppError } from "@/lib/errors";
import { ALLOWED_UPLOADS, MAX_UPLOAD_BYTES } from "@/schemas/evidence";

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
}

export class UploadError extends AppError {
  constructor(message: string) {
    super(message, 400, "INVALID_UPLOAD");
  }
}

/** Display-safe file name: no path segments or control characters, bounded length. */
export function sanitizeFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "fichier";
  const cleaned = base.replace(/[\u0000-\u001f<>:"|?*]/g, "").trim();
  return (cleaned || "fichier").slice(0, 120);
}

/**
 * Checks size, declared type and the file's actual first bytes. The declared MIME type comes
 * from the client and cannot be trusted on its own.
 */
export function validateUpload(file: UploadedFile) {
  if (file.size === 0) throw new UploadError("Le fichier est vide");
  if (file.size > MAX_UPLOAD_BYTES || file.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new UploadError(`Fichier trop volumineux (${MAX_UPLOAD_BYTES / 1024 / 1024} Mo maximum)`);
  }
  const rule = ALLOWED_UPLOADS[file.type as keyof typeof ALLOWED_UPLOADS];
  if (!rule) throw new UploadError("Format non accepté (PDF, PNG, JPEG ou WebP)");
  const matches = rule.magic.every((byte, i) => file.bytes[i] === byte);
  if (!matches) throw new UploadError("Le contenu du fichier ne correspond pas à son format");
  return { ext: rule.ext, mimeType: file.type };
}
