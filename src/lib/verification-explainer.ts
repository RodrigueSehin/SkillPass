import type { SkillVerificationStatus } from "@/types/skill";

export interface ExplainerInput {
  status: SkillVerificationStatus;
  yearsOfExperience: number;
  evidence: { status: "UNVERIFIED" | "PENDING" | "VERIFIED" }[];
  projectCount: number;
}

export interface ExplainerCheck {
  key: "verified-evidence" | "enough-evidence" | "projects" | "experience" | "assessment";
  label: string;
  detail: string;
  met: boolean;
  /** Not available yet in the product: shown as upcoming rather than failed. */
  upcoming?: boolean;
}

export interface Explanation {
  title: string;
  summary: string;
  checks: ExplainerCheck[];
}

/**
 * Answers "why is this skill (not) verified?" with the concrete elements that support it.
 * The status itself is granted by an assessment or a verifier; this lists what backs it.
 */
export function explainVerification(input: ExplainerInput): Explanation {
  const verifiedEvidence = input.evidence.filter((e) => e.status === "VERIFIED").length;
  const checks: ExplainerCheck[] = [
    {
      key: "verified-evidence",
      label: "Au moins une preuve vérifiée",
      detail: `${verifiedEvidence} preuve${verifiedEvidence > 1 ? "s" : ""} vérifiée${verifiedEvidence > 1 ? "s" : ""}`,
      met: verifiedEvidence >= 1,
    },
    {
      key: "enough-evidence",
      label: "Au moins deux preuves au total",
      detail: `${input.evidence.length} preuve${input.evidence.length > 1 ? "s" : ""} rattachée${input.evidence.length > 1 ? "s" : ""}`,
      met: input.evidence.length >= 2,
    },
    {
      key: "projects",
      label: "Un projet qui démontre la compétence",
      detail: `${input.projectCount} projet${input.projectCount > 1 ? "s" : ""} lié${input.projectCount > 1 ? "s" : ""}`,
      met: input.projectCount >= 1,
    },
    {
      key: "experience",
      label: "Au moins un an d'expérience",
      detail: `${input.yearsOfExperience} an${input.yearsOfExperience > 1 ? "s" : ""} déclaré${input.yearsOfExperience > 1 ? "s" : ""}`,
      met: input.yearsOfExperience >= 1,
    },
    {
      key: "assessment",
      label: "Évaluation réussie",
      detail: "Les évaluations arrivent prochainement",
      met: false,
      upcoming: true,
    },
  ];

  const summaries: Record<SkillVerificationStatus, Explanation> = {
    VERIFIED: {
      title: "Pourquoi cette compétence est-elle vérifiée ?",
      summary: "Elle a été validée. Voici les éléments qui appuient son niveau.",
      checks,
    },
    PENDING: {
      title: "Cette compétence est en cours de vérification",
      summary: "Un vérificateur examine votre dossier. Renforcez-le avec des preuves supplémentaires.",
      checks,
    },
    EXPIRED: {
      title: "La vérification de cette compétence a expiré",
      summary: "Ajoutez des preuves récentes ou repassez une évaluation pour la renouveler.",
      checks,
    },
    UNVERIFIED: {
      title: "Comment faire vérifier cette compétence ?",
      summary: "Rattachez des preuves concrètes : plus elles sont solides, plus la vérification est rapide.",
      checks,
    },
  };
  return summaries[input.status];
}
