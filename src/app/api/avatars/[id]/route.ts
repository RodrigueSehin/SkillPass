import { type NextRequest } from "next/server";
import { withPublic } from "@/lib/api/handler";
import { getCurrentUser } from "@/lib/auth/current-user";
import { NotFoundError } from "@/lib/errors";
import { getProfileAvatarService } from "@/services/container";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The photo of a public profile (or of the signed-in owner). SkillPass avatars are drawn inline, not served. */
export const GET = withPublic(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!UUID.test(id) && id !== "demo") throw new NotFoundError("Photo introuvable");
  const viewer = await getCurrentUser();
  const { content, mimeType } = await getProfileAvatarService().open(id, viewer?.id ?? null);
  if ("redirectUrl" in content) return Response.redirect(content.redirectUrl, 302);
  return new Response(Buffer.from(content.bytes), {
    headers: {
      "Content-Type": mimeType,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // The address carries a version that changes with each new photo.
      "Cache-Control": "private, max-age=3600",
    },
  });
});
