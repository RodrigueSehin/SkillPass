import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { submitAssessmentSchema } from "@/schemas/verification";
import { getAssessmentService } from "@/services/container";

export const POST = withUser(
  async (user, request: NextRequest, ctx: RouteContext<"/api/assessments/attempts/[attemptId]/submit">) => {
    const { attemptId } = await ctx.params;
    const { answers } = submitAssessmentSchema.parse(await request.json());
    const { attempt, credential, timedOut } = await getAssessmentService().submit(
      user.id,
      attemptId,
      answers,
    );
    return NextResponse.json({
      status: attempt.status,
      overallScore: attempt.overallScore,
      domainScores: attempt.domainScores,
      level: attempt.level,
      credentialId: credential?.credentialId ?? null,
      timedOut,
    });
  },
);
