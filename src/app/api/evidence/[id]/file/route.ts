import type { NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { getEvidenceService } from "@/services/container";

/** Authenticated download: ownership is enforced by the service before any byte is served. */
export const GET = withUser(
  async (user, _request: NextRequest, ctx: RouteContext<"/api/evidence/[id]/file">) => {
    const { id } = await ctx.params;
    const { content, fileName, mimeType } = await getEvidenceService().openFile(user.id, id);

    if ("redirectUrl" in content) return Response.redirect(content.redirectUrl, 302);

    return new Response(Buffer.from(content.bytes), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        // Uploaded content must never execute in the app's origin.
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cache-Control": "private, no-store",
      },
    });
  },
);
