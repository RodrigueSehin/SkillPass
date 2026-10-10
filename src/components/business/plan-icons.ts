import { Building2, User, UsersRound, type LucideIcon } from "lucide-react";
import type { PlanCode } from "@/types/business";

export const PLAN_ICONS: Record<PlanCode, LucideIcon> = {
  STARTER: User,
  PRO: UsersRound,
  BUSINESS: Building2,
  ENTERPRISE: Building2,
};

/** Tint of the plan's icon tile and of the check marks in the comparison table. */
export const PLAN_TINTS: Record<PlanCode, { tile: string; check: string }> = {
  STARTER: { tile: "bg-slate-100 text-slate-700", check: "bg-slate-400" },
  PRO: { tile: "bg-blue-50 text-brand", check: "bg-brand" },
  BUSINESS: { tile: "bg-blue-50 text-brand", check: "bg-brand" },
  ENTERPRISE: { tile: "bg-violet-50 text-violet-600", check: "bg-violet-600" },
};
