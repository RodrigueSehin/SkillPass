import type { NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { rateLimit } from "@/lib/rate-limit";
import { getEvidenceService } from "@/services/container";

/** The talent asks the SkillPass team to verify one of their published evidence. */
export const POST = withUser(
  async (user, _request: NextRequest, ctx: RouteContext<"/api/evidence/[id]/verification">) => {
    rateLimit(`evidence-verification:${user.id}`, 20, 60_000);
    const { id } = await ctx.params;
    await getEvidenceService().requestVerification(user.id, id);
    return new Response(null, { status: 204 });
  },
);
