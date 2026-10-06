import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { rateLimit } from "@/lib/rate-limit";
import { UploadError } from "@/lib/storage/uploads";
import { MAX_UPLOAD_BYTES } from "@/schemas/evidence";
import { getProjectCoverService } from "@/services/container";

/** multipart/form-data with a single `file` field (an image): sets the cover of one of the user's projects. */
export const POST = withUser(
  async (user, request: NextRequest, ctx: RouteContext<"/api/projects/[id]/cover">) => {
    rateLimit(`project-cover:${user.id}`, 20, 60_000);
    const { id } = await ctx.params;

    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_UPLOAD_BYTES + 64 * 1024) throw new UploadError("Fichier trop volumineux");

    const raw = (await request.formData()).get("file");
    if (!(raw instanceof File) || raw.size === 0) throw new UploadError("Aucun fichier reçu");
    if (raw.size > MAX_UPLOAD_BYTES) throw new UploadError("Fichier trop volumineux");

    await getProjectCoverService().upload(user.id, id, {
      name: raw.name,
      type: raw.type,
      size: raw.size,
      bytes: new Uint8Array(await raw.arrayBuffer()),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  },
);

/** Authenticated image: ownership is enforced before any byte is served. */
export const GET = withUser(
  async (user, _request: NextRequest, ctx: RouteContext<"/api/projects/[id]/cover">) => {
    const { id } = await ctx.params;
    const { content, mimeType } = await getProjectCoverService().open(user.id, id);
    if ("redirectUrl" in content) return Response.redirect(content.redirectUrl, 302);
    return new Response(Buffer.from(content.bytes), {
      headers: {
        "Content-Type": mimeType,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "private, max-age=300",
      },
    });
  },
);
