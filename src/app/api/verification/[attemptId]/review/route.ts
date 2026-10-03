import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { reviewDecisionSchema } from "@/schemas/verification";
import { getAssessmentService } from "@/services/container";

export const POST = withUser(
  async (user, request: NextRequest, ctx: RouteContext<"/api/verification/[attemptId]/review">) => {
    const { attemptId } = await ctx.params;
    const { decision, note } = reviewDecisionSchema.parse(await request.json());
    const { attempt, credential } = await getAssessmentService().review(user.id, attemptId, decision, note);
    return NextResponse.json({ status: attempt.status, credentialId: credential?.credentialId ?? null });
  },
);
