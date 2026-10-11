import { BUSINESS_FEATURES, BUSINESS_FEATURE_LABELS, businessHas } from "@/lib/plans/entitlements";
import type { PlanCode } from "@/types/business";

export interface PlanDef {
  code: PlanCode;
  name: string;
  tagline: string;
  /** Monthly price in FCFA, or null for "Sur devis". */
  price: number | null;
  /** Null means unlimited. */
  maxMembers: number | null;
  maxJobsPerMonth: number | null;
  features: string[];
}

export const PLANS: Record<PlanCode, PlanDef> = {
  STARTER: {
    code: "STARTER",
    name: "Starter",
    tagline: "Idéal pour les petites équipes qui débutent.",
    price: 49_000,
    maxMembers: 5,
    maxJobsPerMonth: 10,
    features: [
      "Jusqu'à 5 membres",
      "10 offres d'emploi / mois",
      "Accès à la base de talents",
      "Filtres de recherche avancés",
      "Support par e-mail",
    ],
  },
  PRO: {
    code: "PRO",
    name: "Pro",
    tagline: "Pour les organisations en croissance.",
    price: 149_000,
    maxMembers: 20,
    maxJobsPerMonth: 50,
    features: [
      "Jusqu'à 20 membres",
      "50 offres d'emploi / mois",
      "Matching IA",
      "Évaluations de compétences",
      "Tableaux de bord avancés",
      "Support prioritaire",
    ],
  },
  BUSINESS: {
    code: "BUSINESS",
    name: "Business",
    tagline: "Pour les entreprises avec des besoins avancés.",
    price: 299_000,
    maxMembers: 100,
    maxJobsPerMonth: null,
    features: [
      "Jusqu'à 100 membres",
      "Offres d'emploi illimitées",
      "Matching IA avancé",
      "Évaluations et certifications",
      "Analytics et rapports avancés",
      "Intégrations (API, SIRH, …)",
      "Support dédié",
    ],
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    name: "Enterprise",
    tagline: "Solution sur-mesure pour grandes organisations.",
    price: null,
    maxMembers: null,
    maxJobsPerMonth: null,
    features: [
      "Membres illimités",
      "Offres d'emploi illimitées",
      "Fonctionnalités avancées",
      "Intégrations personnalisées",
      "Accompagnement dédié",
      "SLA & support premium",
      "Formation et onboarding",
    ],
  },
};

/** How many more people the plan lets the organization hold, or null when unlimited. */
/** Matches the "Matching IA" row of the plan comparison: every plan but Starter. */
export const planHasMatching = (plan: PlanCode) => businessHas(plan, "matching");

export function remainingSeats(plan: PlanCode, used: number) {
  const max = PLANS[plan].maxMembers;
  return max === null ? null : Math.max(0, max - used);
}

export const formatFcfa = (amount: number) => `${amount.toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA`;

/** The comparison table of the subscription page. Numbers come from the plans themselves. */
export const PLAN_COMPARISON: { label: string; values: Record<PlanCode, string | boolean> }[] = [
  {
    label: "Membres de l'organisation",
    values: Object.fromEntries(
      (Object.keys(PLANS) as PlanCode[]).map((code) => [
        code,
        PLANS[code].maxMembers?.toString() ?? "Illimité",
      ]),
    ) as Record<PlanCode, string>,
  },
  {
    label: "Offres d'emploi / mois",
    values: Object.fromEntries(
      (Object.keys(PLANS) as PlanCode[]).map((code) => [
        code,
        PLANS[code].maxJobsPerMonth?.toString() ?? "Illimité",
      ]),
    ) as Record<PlanCode, string>,
  },
  ...BUSINESS_FEATURES.map((feature) => ({
    label: BUSINESS_FEATURE_LABELS[feature],
    values: Object.fromEntries(
      (Object.keys(PLANS) as PlanCode[]).map((code) => [code, businessHas(code, feature)]),
    ) as Record<PlanCode, boolean>,
  })),
];

/** Yearly billing takes 20 % off the monthly price. */
export const YEARLY_DISCOUNT = 0.2;
export const yearlyMonthlyPrice = (monthly: number) => Math.round(monthly * (1 - YEARLY_DISCOUNT));
