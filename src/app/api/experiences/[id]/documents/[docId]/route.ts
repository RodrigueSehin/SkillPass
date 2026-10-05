import type { NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { getExperienceDocumentService } from "@/services/container";

/** Authenticated download: ownership is enforced before any byte is served. */
export const GET = withUser(
  async (user, _request: NextRequest, ctx: RouteContext<"/api/experiences/[id]/documents/[docId]">) => {
    const { id, docId } = await ctx.params;
    const { content, mimeType } = await getExperienceDocumentService().open(user.id, id, docId);
    if ("redirectUrl" in content) return Response.redirect(content.redirectUrl, 302);
    return new Response(Buffer.from(content.bytes), {
      headers: {
        "Content-Type": mimeType,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "private, no-store",
      },
    });
  },
);
