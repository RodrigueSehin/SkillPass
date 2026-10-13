import type { NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { serveStoredFile } from "@/lib/storage/serve";
import { getEvidenceReviewService } from "@/services/container";

/** A file of an evidence under review. The service checks that the caller is the SkillPass administrator. */
export const GET = withUser(
  async (user, _request: NextRequest, ctx: RouteContext<"/api/admin/evidence/[id]/files/[fileId]">) => {
    const { id, fileId } = await ctx.params;
    const { content, fileName, mimeType } = await getEvidenceReviewService().openFile(user.id, id, fileId);
    return serveStoredFile(content, fileName, mimeType);
  },
);
