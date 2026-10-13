import type { NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { serveStoredFile } from "@/lib/storage/serve";
import { getEvidenceService } from "@/services/container";

/** Authenticated download: ownership is enforced by the service before any byte is served. */
export const GET = withUser(
  async (user, _request: NextRequest, ctx: RouteContext<"/api/evidence/[id]/files/[fileId]">) => {
    const { id, fileId } = await ctx.params;
    const { content, fileName, mimeType } = await getEvidenceService().openFile(user.id, id, fileId);
    return serveStoredFile(content, fileName, mimeType);
  },
);
