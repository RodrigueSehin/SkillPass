import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { rateLimit } from "@/lib/rate-limit";
import { UploadError } from "@/lib/storage/uploads";
import { MAX_UPLOAD_BYTES } from "@/schemas/evidence";
import { getCvImportService } from "@/services/container";

/** multipart/form-data with a single `file` (PDF, 5 Mo maximum). The CV is read in memory and never stored. */
export const POST = withUser(async (user, request: NextRequest) => {
  // Each analysis costs a model call: a handful per hour is plenty for filling one profile.
  rateLimit(`cv-analyze:${user.id}`, 5, 60 * 60_000);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024)
    throw new UploadError("Fichier trop volumineux (5 Mo maximum)");

  const raw = (await request.formData()).get("file");
  if (!(raw instanceof File) || raw.size === 0) throw new UploadError("Aucun fichier reçu");
  if (raw.size > MAX_UPLOAD_BYTES) throw new UploadError("Fichier trop volumineux (5 Mo maximum)");

  const proposal = await getCvImportService().analyze(user.id, {
    name: raw.name,
    type: raw.type,
    size: raw.size,
    bytes: new Uint8Array(await raw.arrayBuffer()),
  });
  return NextResponse.json(proposal);
});
