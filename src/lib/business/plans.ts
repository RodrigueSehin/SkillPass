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
export function remainingSeats(plan: PlanCode, used: number) {
  const max = PLANS[plan].maxMembers;
  return max === null ? null : Math.max(0, max - used);
}

export const formatFcfa = (amount: number) => `${amount.toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA`;
