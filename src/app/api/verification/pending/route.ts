import { NextResponse } from "next/server";
import { withUser } from "@/lib/api/handler";
import { getAssessmentService } from "@/services/container";

/** Reviewer roles only; the service answers 403 to everyone else. */
export const GET = withUser(async (user) =>
  NextResponse.json({ items: await getAssessmentService().listPendingReview(user.id) }),
);
