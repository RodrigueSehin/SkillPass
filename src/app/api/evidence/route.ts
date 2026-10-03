import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { UploadError, type UploadedFile } from "@/lib/storage/uploads";
import { rateLimit } from "@/lib/rate-limit";
import { createEvidenceSchema, listEvidenceQuerySchema, MAX_UPLOAD_BYTES } from "@/schemas/evidence";
import { getEvidenceService } from "@/services/container";

export const GET = withUser(async (user, request: NextRequest) => {
  const { skillId } = listEvidenceQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json({ items: await getEvidenceService().list(user.id, skillId) });
});

/** multipart/form-data: text fields + optional `file`. */
export const POST = withUser(async (user, request: NextRequest) => {
  rateLimit(`evidence:${user.id}`, 20, 60_000);

  // Reject oversized bodies before buffering them (small allowance for multipart overhead).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) throw new UploadError("Fichier trop volumineux");

  const form = await request.formData();
  const input = createEvidenceSchema.parse(
    Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")),
  );

  const raw = form.get("file");
  let file: UploadedFile | undefined;
  if (raw instanceof File && raw.size > 0) {
    if (raw.size > MAX_UPLOAD_BYTES) throw new UploadError("Fichier trop volumineux");
    file = { name: raw.name, type: raw.type, size: raw.size, bytes: new Uint8Array(await raw.arrayBuffer()) };
  }

  return NextResponse.json(await getEvidenceService().add(user.id, input, file), { status: 201 });
});
