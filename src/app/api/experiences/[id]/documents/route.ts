import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { rateLimit } from "@/lib/rate-limit";
import { UploadError } from "@/lib/storage/uploads";
import { MAX_UPLOAD_BYTES } from "@/schemas/evidence";
import { getExperienceDocumentService } from "@/services/container";

/** multipart/form-data with a single `file` field: attaches a document to one of the user's experiences. */
export const POST = withUser(
  async (user, request: NextRequest, ctx: RouteContext<"/api/experiences/[id]/documents">) => {
    rateLimit(`experience-document:${user.id}`, 30, 60_000);
    const { id } = await ctx.params;

    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_UPLOAD_BYTES + 64 * 1024) throw new UploadError("Fichier trop volumineux");

    const raw = (await request.formData()).get("file");
    if (!(raw instanceof File) || raw.size === 0) throw new UploadError("Aucun fichier reçu");
    if (raw.size > MAX_UPLOAD_BYTES) throw new UploadError("Fichier trop volumineux");

    await getExperienceDocumentService().upload(user.id, id, {
      name: raw.name,
      type: raw.type,
      size: raw.size,
      bytes: new Uint8Array(await raw.arrayBuffer()),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  },
);
