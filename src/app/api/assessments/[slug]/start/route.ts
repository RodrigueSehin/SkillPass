import { NextResponse, type NextRequest } from "next/server";
import { withUser } from "@/lib/api/handler";
import { rateLimit } from "@/lib/rate-limit";
import { getAssessmentService } from "@/services/container";

export const POST = withUser(
  async (user, _request: NextRequest, ctx: RouteContext<"/api/assessments/[slug]/start">) => {
    rateLimit(`assessment-start:${user.id}`, 10, 60_000);
    const { slug } = await ctx.params;
    const attempt = await getAssessmentService().start(user.id, slug);
    // The browser gets the attempt id; questions are fetched without correct answers.
    return NextResponse.json({ attemptId: attempt.id, deadlineAt: attempt.deadlineAt }, { status: 201 });
  },
);
