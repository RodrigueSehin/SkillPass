export const SKILL_KINDS = ["TECHNICAL", "TRANSVERSAL"] as const;
export type SkillKind = (typeof SKILL_KINDS)[number];
export const SKILL_KIND_LABELS: Record<SkillKind, { title: string; short: string }> = {
  TECHNICAL: { title: "Technique (Hard Skill)", short: "Technique" },
  TRANSVERSAL: { title: "Transversale (Soft Skill)", short: "Transversale" },
};

/** Categories offered when an organization adds a skill. Free entries are always possible. */
export const SKILL_CATEGORIES = [
  "Développement",
  "Power Platform",
  "Data & Analytics",
  "Cloud",
  "Productivité",
  "Collaboration",
  "Base de données",
  "Gestion de projet",
  "Design",
  "Certification",
  "Communication",
  "Leadership",
  "Autres",
] as const;

/** A skill an organization added to its own referential, next to the shared catalog. */
export interface OrgSkillDTO {
  id: string;
  name: string;
  category: string;
  kind: SkillKind;
  description: string;
  keywords: string[];
  synonyms: string[];
  createdAt: string;
}

export type OrgSkillInput = Omit<OrgSkillDTO, "id" | "createdAt">;

export const DEMAND_LEVELS = ["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "NONE"] as const;
export type DemandLevel = (typeof DEMAND_LEVELS)[number];
export const DEMAND_LABELS: Record<DemandLevel, string> = {
  VERY_HIGH: "Très élevée",
  HIGH: "Élevée",
  MEDIUM: "Moyenne",
  LOW: "Faible",
  NONE: "Aucune offre",
};

/** One line of the skills table: a skill of the catalog, of the talents or of the organization's referential. */
export interface SkillRow {
  name: string;
  category: string;
  kind: SkillKind;
  /** Public talents who hold it. */
  talents: number;
  /** Average of the talents' scores, on 5 (score / 20); null when nobody holds it. */
  averageLevel: number | null;
  /** Active job offers asking for it. */
  offers: number;
  demand: DemandLevel;
  /** Set for the organization's own skills. */
  orgSkillId: string | null;
}
