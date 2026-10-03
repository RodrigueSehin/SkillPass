"use server";

import { revalidatePath } from "next/cache";
import { runAction } from "@/lib/actions/run";
import { reviewDecisionSchema } from "@/schemas/verification";
import { getAssessmentService } from "@/services/container";

export async function reviewAttemptAction(attemptId: string, values: unknown) {
  const result = await runAction(async (userId) => {
    const { decision, note } = reviewDecisionSchema.parse(values);
    // The service checks the reviewer role itself: the UI gate is not the security boundary.
    await getAssessmentService().review(userId, attemptId, decision, note);
  });
  revalidatePath("/admin/verifications");
  return result;
}
