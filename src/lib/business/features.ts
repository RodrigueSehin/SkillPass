import { notFound } from "next/navigation";
import { businessHas, type BusinessFeature } from "@/lib/plans/entitlements";
import type { PlanCode } from "@/types/business";

/**
 * Pages of a feature the organization's plan lacks do not exist for it: a typed address gets a plain 404,
 * the same as for any unknown page.
 */
export function requireBusinessFeature(ctx: { organization: { plan: PlanCode } }, feature: BusinessFeature) {
  if (!businessHas(ctx.organization.plan, feature)) notFound();
}
