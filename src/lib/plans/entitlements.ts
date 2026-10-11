import type { PlanCode } from "@/types/business";

/**
 * What each plan includes, in one place. Pages, menus and server actions all ask these functions: a feature
 * the plan does not include is not shown, and its server actions refuse.
 */

// ---------------------------------------------------------------------------------------------------------
// SkillPass Business (organizations)
// ---------------------------------------------------------------------------------------------------------

export const BUSINESS_FEATURES = [
  "talentSearch",
  "matching",
  "evaluations",
  "analytics",
  "integrations",
  "dedicatedSupport",
] as const;
export type BusinessFeature = (typeof BUSINESS_FEATURES)[number];

export const BUSINESS_FEATURE_LABELS: Record<BusinessFeature, string> = {
  talentSearch: "Accès à la base de talents",
  matching: "Matching IA",
  evaluations: "Évaluations de compétences",
  analytics: "Analytics avancés",
  integrations: "Intégrations (API, SIRH, …)",
  dedicatedSupport: "Support dédié",
};

const ALL: PlanCode[] = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"];
const FROM_PRO: PlanCode[] = ["PRO", "BUSINESS", "ENTERPRISE"];
const FROM_BUSINESS: PlanCode[] = ["BUSINESS", "ENTERPRISE"];

const BUSINESS_PLANS_WITH: Record<BusinessFeature, readonly PlanCode[]> = {
  talentSearch: ALL,
  matching: FROM_PRO,
  evaluations: FROM_PRO,
  analytics: FROM_PRO,
  integrations: FROM_BUSINESS,
  dedicatedSupport: FROM_BUSINESS,
};

export const businessHas = (plan: PlanCode, feature: BusinessFeature) =>
  BUSINESS_PLANS_WITH[feature].includes(plan);

/** The plan feature a permission depends on, when it depends on one. */
export function featureOfPermission(permission: string): BusinessFeature | null {
  if (permission.startsWith("evaluations.")) return "evaluations";
  if (permission.startsWith("analytics.")) return "analytics";
  if (permission === "talents.recommendations") return "matching";
  return null;
}

/** A member can use a permission only if the organization's plan includes the feature behind it. */
export const planAllowsPermission = (plan: PlanCode, permission: string) => {
  const feature = featureOfPermission(permission);
  return feature === null || businessHas(plan, feature);
};

/** The lowest plan that includes the feature, to tell a member what to upgrade to. */
export const businessFeatureFrom = (feature: BusinessFeature): PlanCode => BUSINESS_PLANS_WITH[feature][0]!;

// ---------------------------------------------------------------------------------------------------------
// SkillPass talent accounts
// ---------------------------------------------------------------------------------------------------------

export const TALENT_PLAN_CODES = ["FREE", "PRO"] as const;
export type TalentPlanCode = (typeof TALENT_PLAN_CODES)[number];

export const TALENT_FEATURES = [
  "portfolioBadges",
  "assessments",
  "aiAssistant",
  "analytics",
  "digitalCv",
] as const;
export type TalentFeature = (typeof TALENT_FEATURES)[number];

const TALENT_PLANS_WITH: Record<TalentFeature, readonly TalentPlanCode[]> = {
  portfolioBadges: ["PRO"],
  assessments: ["PRO"],
  aiAssistant: ["PRO"],
  analytics: ["PRO"],
  digitalCv: ["FREE", "PRO"],
};

export const talentHas = (plan: TalentPlanCode, feature: TalentFeature) =>
  TALENT_PLANS_WITH[feature].includes(plan);

export interface TalentPlanDef {
  code: TalentPlanCode;
  name: string;
  tagline: string;
  /** Price as shown on the pricing page. */
  price: string;
  /** Null means unlimited. */
  maxSkills: number | null;
  maxProjects: number | null;
  /** Lines of the plan card. `soon` marks what is announced but not built yet. */
  features: { label: string; soon?: boolean }[];
}

export const TALENT_PLANS: Record<TalentPlanCode, TalentPlanDef> = {
  FREE: {
    code: "FREE",
    name: "Free",
    tagline: "Pour démarrer",
    price: "0 FCFA",
    maxSkills: 5,
    maxProjects: 3,
    features: [
      { label: "Profil public" },
      { label: "5 compétences" },
      { label: "3 projets" },
      { label: "QR Code" },
      { label: "CV numérique", soon: true },
    ],
  },
  PRO: {
    code: "PRO",
    name: "Pro",
    tagline: "Pour se démarquer",
    price: "3 000 – 5 000 FCFA / mois",
    maxSkills: null,
    maxProjects: null,
    features: [
      { label: "Compétences et projets illimités" },
      { label: "Portfolio et badges" },
      { label: "Évaluations" },
      { label: "Assistant IA", soon: true },
      { label: "Analytics", soon: true },
      { label: "Tout le plan Free" },
    ],
  },
};

export type TalentLimit = "skills" | "projects";
export const talentLimit = (plan: TalentPlanCode, limit: TalentLimit): number | null =>
  limit === "skills" ? TALENT_PLANS[plan].maxSkills : TALENT_PLANS[plan].maxProjects;

export const TALENT_LIMIT_LABELS: Record<TalentLimit, { one: string; many: string }> = {
  skills: { one: "compétence", many: "compétences" },
  projects: { one: "projet", many: "projets" },
};

/** Anything stored or typed outside the known codes counts as the free plan. */
export const parseTalentPlan = (v: unknown): TalentPlanCode =>
  (TALENT_PLAN_CODES as readonly unknown[]).includes(v) ? (v as TalentPlanCode) : "FREE";
