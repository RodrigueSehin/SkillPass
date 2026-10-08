import type { SkillLevel } from "./skill";

export const EVALUATION_TYPES = ["TECHNICAL", "TRANSVERSAL", "CERTIFICATION"] as const;
export type EvaluationType = (typeof EVALUATION_TYPES)[number];
export const EVALUATION_TYPE_LABELS: Record<EvaluationType, { title: string; description: string }> = {
  TECHNICAL: { title: "Technique", description: "Test de connaissances et mises en pratique" },
  TRANSVERSAL: { title: "Transversale", description: "Soft skills et comportementale" },
  CERTIFICATION: { title: "Certification", description: "Test pour certification" },
};

export const EVALUATION_DURATIONS = [15, 20, 30, 45, 60, 90, 120] as const;
export const EVALUATION_LANGUAGES = ["Français", "Anglais"] as const;

export const QUESTION_TYPES = [
  "SINGLE",
  "MULTIPLE",
  "TRUE_FALSE",
  "SHORT",
  "LONG",
  "SCENARIO",
  "PRACTICAL",
  "CASE_STUDY",
  "FILE_UPLOAD",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];
export const QUESTION_TYPE_LABELS: Record<QuestionType, { title: string; description: string }> = {
  SINGLE: { title: "Choix unique", description: "Une seule bonne réponse" },
  MULTIPLE: { title: "Choix multiple", description: "Plusieurs bonnes réponses" },
  TRUE_FALSE: { title: "Vrai / Faux", description: "Réponse vrai ou faux" },
  SHORT: { title: "Réponse courte", description: "Texte libre court" },
  LONG: { title: "Réponse longue", description: "Texte libre détaillé" },
  SCENARIO: { title: "Mise en situation", description: "Scénario pratique" },
  PRACTICAL: { title: "Exercice pratique", description: "Manipulation dans un environnement" },
  CASE_STUDY: { title: "Étude de cas", description: "Analyse et résolution" },
  FILE_UPLOAD: { title: "Téléversement de fichier", description: "Document, code, présentation" },
};
/** Types a machine can mark; every other type is read by a person. */
export const AUTO_GRADED: readonly QuestionType[] = ["SINGLE", "MULTIPLE", "TRUE_FALSE"];
export const isChoice = (t: QuestionType) => t === "SINGLE" || t === "MULTIPLE";
export const TRUE_FALSE_OPTIONS = ["Vrai", "Faux"] as const;

export const QUESTION_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];
export const QUESTION_DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  EASY: "Facile",
  MEDIUM: "Moyen",
  HARD: "Difficile",
};

export interface EvaluationQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  /** Choices for SINGLE / MULTIPLE (2 to 6); "Vrai", "Faux" for TRUE_FALSE; empty otherwise. */
  options: string[];
  /** Indexes of the right options. Empty for questions a person reads. */
  correct: number[];
  difficulty: QuestionDifficulty;
  points: number;
}

export const ATTEMPT_LIMITS = [1, 2, 3, 0] as const; // 0 = unlimited
export const ATTEMPT_LABELS: Record<number, string> = {
  1: "1 tentative",
  2: "2 tentatives",
  3: "3 tentatives",
  0: "Illimitées",
};
export const SHOW_SCORE_OPTIONS = ["IMMEDIATE", "AFTER_REVIEW", "NEVER"] as const;
export type ShowScore = (typeof SHOW_SCORE_OPTIONS)[number];
export const SHOW_SCORE_LABELS: Record<ShowScore, string> = {
  IMMEDIATE: "Oui, immédiatement",
  AFTER_REVIEW: "Oui, après validation",
  NEVER: "Non",
};
export const WEIGHTINGS = ["EQUAL", "BY_POINTS"] as const;
export type Weighting = (typeof WEIGHTINGS)[number];
export const WEIGHTING_LABELS: Record<Weighting, string> = {
  EQUAL: "Toutes les questions ont le même poids",
  BY_POINTS: "Selon les points de chaque question",
};

export interface EvaluationSettings {
  attempts: number;
  /** One question at a time, or the whole test on one page. */
  display: "ONE_BY_ONE" | "ALL";
  navigation: "FREE" | "LINEAR";
  /** Seconds per question, or null for no limit. */
  timePerQuestion: number | null;
  devices: { computer: boolean; tablet: boolean; mobile: boolean };
  passScore: number;
  weighting: Weighting;
  showScore: ShowScore;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  fullscreen: boolean;
  limitCopyPaste: boolean;
  /** Passage window (ISO local date-times), or null for no window. */
  windowStart: string | null;
  windowEnd: string | null;
}

export const DEFAULT_SETTINGS: EvaluationSettings = {
  attempts: 1,
  display: "ONE_BY_ONE",
  navigation: "FREE",
  timePerQuestion: null,
  devices: { computer: true, tablet: true, mobile: false },
  passScore: 70,
  weighting: "EQUAL",
  showScore: "IMMEDIATE",
  shuffleQuestions: true,
  shuffleAnswers: true,
  fullscreen: true,
  limitCopyPaste: true,
  windowStart: null,
  windowEnd: null,
};

export const EVALUATION_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];
export type EvaluationDisplayStatus = EvaluationStatus | "SCHEDULED";
export const EVALUATION_STATUS_LABELS: Record<EvaluationDisplayStatus, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
  SCHEDULED: "Programmé",
};

export interface EvaluationDTO {
  id: string;
  title: string;
  description: string;
  /** Main skill evaluated. */
  skill: string;
  type: EvaluationType;
  difficulty: SkillLevel;
  durationMinutes: number;
  language: string;
  questions: EvaluationQuestion[];
  settings: EvaluationSettings;
  status: EvaluationStatus;
  /** When it goes live; null = as soon as it is published. */
  publishAt: string | null;
  /** Unguessable id of the candidate link. */
  shareToken: string;
  createdById: string | null;
  createdAt: string;
}

export type EvaluationInput = Omit<
  EvaluationDTO,
  "id" | "status" | "shareToken" | "createdById" | "createdAt"
>;

export interface EvaluationAttemptRow {
  id: string;
  evaluationId: string;
  /** Profile id: tells two attempts of the same person from two people. */
  candidateId: string;
  candidateName: string;
  candidateUsername: string | null;
  score: number | null;
  passed: boolean | null;
  /** SUBMITTED waits for a person to read the open questions. */
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  submittedAt: string | null;
}

export interface EvaluationRow extends Omit<EvaluationDTO, "questions"> {
  questionCount: number;
  displayStatus: EvaluationDisplayStatus;
  /** People who submitted at least once. */
  candidates: number;
  /** Share of graded attempts that passed, 0-100; null before any graded attempt. */
  successRate: number | null;
}

/** One answer: the chosen option indexes of a choice question, or the text of an open one. */
export interface AttemptResponse {
  choices?: number[];
  text?: string;
}

export interface EvaluationAttemptDTO {
  id: string;
  evaluationId: string;
  profileId: string;
  responses: Record<string, AttemptResponse>;
  /** Points a person gave to each open question. */
  review: Record<string, number>;
  /** True once the result may be shown to the candidate. */
  released: boolean;
  score: number | null;
  passed: boolean | null;
  status: EvaluationAttemptRow["status"];
  startedAt: string;
  submittedAt: string | null;
}

/** A question as the candidate sees it: no right answers, options possibly in another order. */
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  /** index is the position in the stored question, whatever the display order. */
  options: { index: number; label: string }[];
}
