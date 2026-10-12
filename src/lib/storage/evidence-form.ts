import type { NextRequest } from "next/server";
import { MAX_EVIDENCE_FILES, MAX_UPLOAD_BYTES } from "@/schemas/evidence";
import { UploadError, type UploadedFile } from "./uploads";

/** Reads the multipart body of the evidence wizard: `data` (JSON) + up to 5 `files`. */
export async function readEvidenceForm(
  request: NextRequest,
): Promise<{ json: unknown; files: UploadedFile[] }> {
  // Reject oversized bodies before buffering them (small allowance for multipart overhead).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES * MAX_EVIDENCE_FILES + 64 * 1024)
    throw new UploadError("Fichiers trop volumineux");

  const form = await request.formData();
  const rawData = form.get("data");
  if (typeof rawData !== "string") throw new UploadError("Données manquantes");
  let json: unknown;
  try {
    json = JSON.parse(rawData);
  } catch {
    throw new UploadError("Données invalides");
  }

  const files: UploadedFile[] = [];
  for (const raw of form.getAll("files")) {
    if (!(raw instanceof File) || raw.size === 0) continue;
    if (raw.size > MAX_UPLOAD_BYTES) throw new UploadError("Fichier trop volumineux");
    files.push({
      name: raw.name,
      type: raw.type,
      size: raw.size,
      bytes: new Uint8Array(await raw.arrayBuffer()),
    });
  }
  return { json, files };
}
