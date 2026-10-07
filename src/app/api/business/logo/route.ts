import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { requireBusiness } from "@/lib/business/context";
import { ForbiddenError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { UploadError } from "@/lib/storage/uploads";
import { MAX_UPLOAD_BYTES } from "@/schemas/evidence";
import { getOrganizationLogoService } from "@/services/container";

const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** The logo of the caller's organization, shown to its members. */
export const GET = withUser(async () => {
  const ctx = await requireBusiness();
  const { content, mimeType } = await getOrganizationLogoService().open(ctx.organization.id);
  if ("redirectUrl" in content) return Response.redirect(content.redirectUrl, 302);
  return new Response(Buffer.from(content.bytes), {
    headers: {
      "Content-Type": mimeType,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // The URL carries a version, so the browser may keep it.
      "Cache-Control": "private, max-age=3600",
    },
  });
});

/** multipart/form-data with a single `file` field (PNG, JPG or WebP, 2 Mo maximum). */
export const POST = withUser(async (user, request: NextRequest) => {
  const ctx = await requireBusiness();
  if (!ctx.can("org.manage")) throw new ForbiddenError("Vous n'avez pas l'autorisation de modifier le logo.");
  rateLimit(`org-logo:${user.id}`, 10, 60_000);

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > Math.min(LOGO_MAX_BYTES, MAX_UPLOAD_BYTES) + 64 * 1024) throw new UploadError("Logo trop volumineux (2 Mo maximum)");
  const raw = (await request.formData()).get("file");
  if (!(raw instanceof File) || raw.size === 0) throw new UploadError("Aucun fichier reçu");
  if (raw.size > LOGO_MAX_BYTES) throw new UploadError("Logo trop volumineux (2 Mo maximum)");

  await getOrganizationLogoService().upload(ctx.organization.id, user.id, {
    name: raw.name,
    type: raw.type,
    size: raw.size,
    bytes: new Uint8Array(await raw.arrayBuffer()),
  });
  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = withUser(async () => {
  const ctx = await requireBusiness();
  if (!ctx.can("org.manage")) throw new ForbiddenError("Vous n'avez pas l'autorisation de modifier le logo.");
  await getOrganizationLogoService().remove(ctx.organization.id);
  return NextResponse.json({ ok: true });
});
