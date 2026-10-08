"use server";

import { revalidatePath } from "next/cache";
import { businessAction } from "@/lib/business/action";
import { PLANS } from "@/lib/business/plans";
import { ForbiddenError } from "@/lib/errors";
import { getOrganizationService } from "@/services/container";
import type { PlanCode } from "@/types/business";

/**
 * Switches plan without paying. Only outside production: it exists so the plan limits can be tried in demo and
 * development, and is closed as soon as real payments are needed.
 */
export async function changePlanAction(plan: PlanCode) {
  const result = await businessAction("org.manage", async (ctx) => {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenError(
        "Le paiement en ligne n'est pas encore ouvert : le changement de plan est indisponible.",
      );
    }
    if (ctx.member.role !== "ADMIN") throw new ForbiddenError("Seul un administrateur peut changer de plan.");
    if (!(plan in PLANS)) throw new ForbiddenError("Plan inconnu.");
    await getOrganizationService().changePlan(ctx.organization.id, plan);
  });
  revalidatePath("/business", "layout");
  return result.error ? { error: result.error } : {};
}
