import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { UploadError, type UploadedFile } from "@/lib/storage/uploads";
import { rateLimit } from "@/lib/rate-limit";
import {
  createEvidenceSchema,
  listEvidenceQuerySchema,
  MAX_EVIDENCE_FILES,
  MAX_UPLOAD_BYTES,
} from "@/schemas/evidence";
import { getEvidenceService } from "@/services/container";

export const GET = withUser(async (user, request: NextRequest) => {
  const { skillId } = listEvidenceQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json({ items: await getEvidenceService().list(user.id, skillId) });
});

/** multipart/form-data: `data` (JSON of the wizard) + up to 5 `files`. */
export const POST = withUser(async (user, request: NextRequest) => {
  rateLimit(`evidence:${user.id}`, 20, 60_000);

  // Reject oversized bodies before buffering them (small allowance for multipart overhead).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES * MAX_EVIDENCE_FILES + 64 * 1024) throw new UploadError("Fichiers trop volumineux");

  const form = await request.formData();
  const rawData = form.get("data");
  if (typeof rawData !== "string") throw new UploadError("Données manquantes");
  let json: unknown;
  try {
    json = JSON.parse(rawData);
  } catch {
    throw new UploadError("Données invalides");
  }
  const input = createEvidenceSchema.parse(json);

  const files: UploadedFile[] = [];
  for (const raw of form.getAll("files")) {
    if (!(raw instanceof File) || raw.size === 0) continue;
    if (raw.size > MAX_UPLOAD_BYTES) throw new UploadError("Fichier trop volumineux");
    files.push({ name: raw.name, type: raw.type, size: raw.size, bytes: new Uint8Array(await raw.arrayBuffer()) });
  }

  return NextResponse.json(await getEvidenceService().add(user.id, input, files), { status: 201 });
});
