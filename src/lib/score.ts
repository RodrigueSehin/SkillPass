/**
 * SkillPass Score — transparent and explainable.
 * Each criterion has a fixed weight (total 100) and a documented rule, so a user can always
 * see which points they earned and what to do to earn the rest.
 */
export interface ScoreInput {
  skills: {
    score: number;
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "EXPIRED";
    evidenceCount: number;
  }[];
  /** Years of experience: the larger of the declared value and the sum of dated positions. */
  yearsOfExperience: number;
  projectCount: number;
  certifications: {
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "EXPIRED";
    expired: boolean;
  }[];
  recommendationCount: number;
  /** Days since the profile was last updated. */
  daysSinceActivity: number;
}

export interface ScoreCriterion {
  key: "skills" | "experience" | "evidence" | "certifications" | "recommendations" | "activity";
  label: string;
  points: number;
  max: number;
  /** One sentence telling the user how the points were earned or how to earn more. */
  hint: string;
}

export interface ScoreResult {
  total: number;
  max: 100;
  criteria: ScoreCriterion[];
}

const ratio = (value: number, target: number) => Math.min(Math.max(value / target, 0), 1);

export function computeSkillPassScore(input: ScoreInput): ScoreResult {
  // 30 — Evaluated skills: average score of the best 5 verified skills, scaled by how many are verified.
  const verified = input.skills
    .filter((s) => s.verificationStatus === "VERIFIED")
    .map((s) => s.score)
    .sort((a, b) => b - a)
    .slice(0, 5);
  const skillPoints = verified.length ? (verified.reduce((a, b) => a + b, 0) / 500) * 30 : 0;

  // 20 — Experience: full marks at 8 years.
  const experiencePoints = ratio(input.yearsOfExperience, 8) * 20;

  // 20 — Evidence & projects: each project or piece of evidence counts, full marks at 10.
  const evidenceTotal = input.skills.reduce((sum, s) => sum + s.evidenceCount, 0) + input.projectCount;
  const evidencePoints = ratio(evidenceTotal, 10) * 20;

  // 15 — Certifications: verified = 1, pending = 0.5, expired or unverified = 0. Full marks at 3.
  const certWeight = input.certifications.reduce((sum, c) => {
    if (c.expired) return sum;
    return sum + (c.verificationStatus === "VERIFIED" ? 1 : c.verificationStatus === "PENDING" ? 0.5 : 0);
  }, 0);
  const certPoints = ratio(certWeight, 3) * 15;

  // 10 — Recommendations: full marks at 5.
  const recoPoints = ratio(input.recommendationCount, 5) * 10;

  // 5 — Recent activity.
  const activityPoints = input.daysSinceActivity <= 30 ? 5 : input.daysSinceActivity <= 90 ? 3 : 1;

  const criteria: ScoreCriterion[] = [
    {
      key: "skills",
      label: "Compétences évaluées",
      points: Math.round(skillPoints),
      max: 30,
      hint: "Moyenne de vos 5 meilleures compétences vérifiées.",
    },
    {
      key: "experience",
      label: "Expérience",
      points: Math.round(experiencePoints),
      max: 20,
      hint: "Points maximum à partir de 8 ans d'expérience.",
    },
    {
      key: "evidence",
      label: "Preuves & projets",
      points: Math.round(evidencePoints),
      max: 20,
      hint: "Chaque projet ou preuve compte, maximum à 10.",
    },
    {
      key: "certifications",
      label: "Certifications",
      points: Math.round(certPoints),
      max: 15,
      hint: "Une certification vérifiée vaut 1, en cours de vérification 0,5. Maximum à 3.",
    },
    {
      key: "recommendations",
      label: "Recommandations",
      points: Math.round(recoPoints),
      max: 10,
      hint: "Maximum à 5 recommandations reçues.",
    },
    {
      key: "activity",
      label: "Activité récente",
      points: activityPoints,
      max: 5,
      hint: "5 points si le profil a été mis à jour ces 30 derniers jours.",
    },
  ];

  return { total: criteria.reduce((sum, c) => sum + c.points, 0), max: 100, criteria };
}
