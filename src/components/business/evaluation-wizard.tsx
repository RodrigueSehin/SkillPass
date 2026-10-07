"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  CircleDot,
  Clock,
  Code2,
  Copy,
  FileSearch,
  FileText,
  Globe,
  Layers,
  Mail,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  SquareCheck,
  TextCursorInput,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { saveEvaluationAction } from "@/app/business/evaluations/actions";
import { Label } from "@/components/ui/label";
import { SOFT_SKILLS, TECH_SKILLS } from "@/config/job-catalog";
import { skillVisual } from "@/config/skill-visuals";
import { questionMix, totalPoints } from "@/lib/business/evaluation-view";
import { evaluationSchema, publishableEvaluationSchema } from "@/schemas/evaluation";
import { cn } from "@/lib/utils/cn";
import {
  ATTEMPT_LABELS,
  ATTEMPT_LIMITS,
  DEFAULT_SETTINGS,
  EVALUATION_DURATIONS,
  EVALUATION_LANGUAGES,
  EVALUATION_TYPES,
  EVALUATION_TYPE_LABELS,
  QUESTION_DIFFICULTY_LABELS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  SHOW_SCORE_LABELS,
  SHOW_SCORE_OPTIONS,
  WEIGHTINGS,
  WEIGHTING_LABELS,
  type EvaluationDTO,
  type EvaluationInput,
  type EvaluationQuestion,
  type EvaluationSettings,
  type QuestionType,
} from "@/types/evaluation";
import { SKILL_LEVELS, SKILL_LEVEL_LABELS, type SkillLevel } from "@/types/skill";
import { Donut } from "./charts";
import { QuestionEditor } from "./question-editor";
import { InfoBox, PreviewPanel, Stepper, WizardHeader, WizardNav } from "./wizard-parts";
import { Panel } from "./ui";

const STEPS = [
  { title: "Informations générales", subtitle: "Définissez l'évaluation" },
  { title: "Contenu du test", subtitle: "Ajoutez les questions" },
  { title: "Paramètres", subtitle: "Configurez l'expérience" },
  { title: "Publication", subtitle: "Vérifiez et publiez" },
];
const TIPS = [
  {
    title: "Conseils pour une bonne évaluation",
    items: [
      "Choisissez un titre clair et explicite",
      "Décrivez les objectifs et le niveau attendu",
      "Sélectionnez la bonne compétence principale",
      "Adaptez la durée au niveau de difficulté",
      "Utilisez un langage simple et précis",
    ],
  },
  {
    title: "Conseils pour de bonnes questions",
    items: [
      "Posez des questions claires et précises",
      "Couvrez différents niveaux de difficulté",
      "Testez des connaissances et des cas pratiques",
      "Variez les types de questions",
      "Évitez les questions ambiguës",
      "Vérifiez l'orthographe et la grammaire",
    ],
  },
  {
    title: "Conseils pour bien configurer votre évaluation",
    items: [
      "Définissez une durée adaptée au niveau de difficulté",
      "Activez les options de sécurité pour des résultats fiables",
      "Définissez un score de réussite réaliste",
      "Utilisez un badge pour valoriser les compétences",
    ],
  },
];
const QUESTION_ICONS: Record<QuestionType, { icon: LucideIcon; tone: string }> = {
  SINGLE: { icon: CircleDot, tone: "bg-violet-100 text-violet-600" },
  MULTIPLE: { icon: SquareCheck, tone: "bg-blue-100 text-brand" },
  TRUE_FALSE: { icon: CheckCircle2, tone: "bg-green-100 text-green-600" },
  SHORT: { icon: TextCursorInput, tone: "bg-violet-100 text-violet-600" },
  LONG: { icon: AlignLeft, tone: "bg-violet-100 text-violet-600" },
  SCENARIO: { icon: FileText, tone: "bg-orange-100 text-orange-600" },
  PRACTICAL: { icon: Code2, tone: "bg-pink-100 text-pink-600" },
  CASE_STUDY: { icon: FileSearch, tone: "bg-blue-100 text-brand" },
  FILE_UPLOAD: { icon: Upload, tone: "bg-blue-100 text-brand" },
};
const DIFFICULTY_TONES = {
  EASY: "bg-green-50 text-green-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HARD: "bg-red-50 text-red-600",
};
const MIX_COLORS = [
  "#7C3AED",
  "#2563EB",
  "#EC4899",
  "#16A34A",
  "#F59E0B",
  "#EF4444",
  "#0EA5E9",
  "#14B8A6",
  "#64748B",
];

const field =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2 aria-[invalid=true]:border-danger";
const SKILL_CATALOG = [...new Set([...TECH_SKILLS, ...SOFT_SKILLS])];
const MAX_TITLE = 100;
const MAX_DESCRIPTION = 500;

type PublishMode = "NOW" | "SCHEDULED" | "DRAFT";
const pad = (n: number) => String(n).padStart(2, "0");
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

interface Values {
  title: string;
  description: string;
  skill: string;
  type: EvaluationInput["type"];
  difficulty: SkillLevel;
  durationMinutes: number;
  language: string;
  questions: EvaluationQuestion[];
  settings: EvaluationSettings;
  mode: PublishMode;
  publishDate: string;
  publishTime: string;
}

function initial(evaluation: EvaluationDTO | undefined, template: EvaluationInput | undefined): Values {
  const source = evaluation ?? template;
  const [date, time] = (evaluation?.publishAt ?? "").split("T");
  return {
    title: source?.title ?? "",
    description: source?.description ?? "",
    skill: source?.skill ?? "",
    type: source?.type ?? "TECHNICAL",
    difficulty: source?.difficulty ?? "INTERMEDIATE",
    durationMinutes: source?.durationMinutes ?? 45,
    language: source?.language ?? "Français",
    questions: source?.questions ?? [],
    settings: source?.settings ?? { ...DEFAULT_SETTINGS, devices: { ...DEFAULT_SETTINGS.devices } },
    mode: evaluation?.status === "DRAFT" ? "DRAFT" : date ? "SCHEDULED" : "NOW",
    publishDate: date ?? todayLocal(),
    publishTime: time ?? "10:00",
  };
}

function blankQuestion(type: QuestionType): EvaluationQuestion {
  return {
    id: crypto.randomUUID(),
    type,
    prompt: "",
    options:
      type === "SINGLE" || type === "MULTIPLE" ? ["", ""] : type === "TRUE_FALSE" ? ["Vrai", "Faux"] : [],
    correct: [],
    difficulty: "MEDIUM",
    points: type === "SINGLE" || type === "TRUE_FALSE" ? 2 : 3,
  };
}

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-brand" : "bg-slate-300",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
          checked ? "left-[1.35rem]" : "left-0.5",
        )}
      />
    </button>
  );
}

function SwitchRow({
  title,
  text,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
      <div className="text-sm">
        <p className="text-navy font-medium">{title}</p>
        <p className="text-muted text-xs">{text}</p>
      </div>
    </div>
  );
}

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h3 className="text-navy flex items-center gap-3 text-base font-bold">
      <span className="bg-brand flex size-8 items-center justify-center rounded-full text-sm text-white">
        {n}
      </span>
      {children}
    </h3>
  );
}

function SkillTile({ skill, className }: { skill: string; className?: string }) {
  const visual = skillVisual(skill);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl",
        visual.tile,
        className ?? "size-14",
      )}
    >
      <visual.icon className="size-1/2" aria-hidden />
    </span>
  );
}

export function EvaluationWizard({
  evaluation,
  template,
  origin,
}: {
  /** Set when editing an existing test. */
  evaluation?: EvaluationDTO;
  /** Library model used as the starting point of a new test. */
  template?: EvaluationInput;
  origin: string;
}) {
  const router = useRouter();
  const editing = Boolean(evaluation);
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Values>(() => initial(evaluation, template));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [editingQuestion, setEditingQuestion] = useState<{
    question: EvaluationQuestion;
    isNew: boolean;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };
  const setting = <K extends keyof EvaluationSettings>(key: K, value: EvaluationSettings[K]) =>
    setV((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));

  const st = v.settings;
  const alreadyPublished = evaluation?.status === "PUBLISHED";
  const shareUrl = evaluation ? `${origin}/e/${evaluation.shareToken}` : null;
  const points = totalPoints(v.questions);
  const mix = questionMix(v.questions);
  const previewQuestion = v.questions.find((q) => q.id === selected) ?? v.questions[0];
  const badge =
    st.badge.trim() || (v.skill ? `${v.skill} ${SKILL_LEVEL_LABELS[v.difficulty]}` : "Badge de réussite");
  const typeLabel = EVALUATION_TYPE_LABELS[v.type].title;

  function payload() {
    return {
      title: v.title,
      description: v.description,
      skill: v.skill,
      type: v.type,
      difficulty: v.difficulty,
      durationMinutes: v.durationMinutes,
      language: v.language,
      questions: v.questions,
      settings: st,
      publishAt: v.mode === "SCHEDULED" ? `${v.publishDate}T${v.publishTime}` : null,
    };
  }

  function check(forStep: number) {
    const found: Record<string, string> = {};
    if (forStep === 0) {
      if (v.title.trim().length < 3) found.title = "Le titre est requis (3 caractères minimum)";
      if (!v.skill.trim()) found.skill = "Choisissez la compétence principale";
      if (v.description.trim().length < 20)
        found.description = "Décrivez l'évaluation (20 caractères minimum)";
    }
    if (forStep === 1 && v.questions.length === 0) found.questions = "Ajoutez au moins une question";
    if (forStep === 1 && editingQuestion) found.questions = "Enregistrez ou annulez la question en cours";
    if (forStep === 2) {
      const parsed = evaluationSchema.safeParse(payload());
      if (!parsed.success) {
        const issue = parsed.error.issues.find((i) => i.path[0] === "settings");
        if (issue) found.settings = issue.message;
      }
    }
    if (forStep === 3 && v.mode === "SCHEDULED" && !(v.publishDate && v.publishTime))
      found.publish = "Choisissez la date et l'heure de publication";
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  function save(publish: boolean) {
    setServerError(undefined);
    const parsed = (publish ? publishableEvaluationSchema : evaluationSchema).safeParse(payload());
    if (!parsed.success) {
      const issue = parsed.error.issues[0]!;
      const root = String(issue.path[0]);
      setStep(root === "questions" ? 1 : root === "settings" ? 2 : root === "publishAt" ? 3 : 0);
      return setServerError(issue.message);
    }
    startTransition(async () => {
      const result = await saveEvaluationAction(evaluation?.id ?? null, payload(), publish);
      if (result.error) setServerError(result.error);
      else router.push("/business/evaluations");
    });
  }

  const finish = () => {
    if (!check(3)) return;
    save(v.mode !== "DRAFT");
  };

  function addQuestion(type: QuestionType) {
    if (editingQuestion) return setErrors({ questions: "Enregistrez ou annulez la question en cours" });
    setErrors({});
    setEditingQuestion({ question: blankQuestion(type), isNew: true });
  }
  function saveQuestion(q: EvaluationQuestion) {
    setV((prev) => ({
      ...prev,
      questions: prev.questions.some((x) => x.id === q.id)
        ? prev.questions.map((x) => (x.id === q.id ? q : x))
        : [...prev.questions, q],
    }));
    setSelected(q.id);
    setEditingQuestion(null);
    setErrors({});
  }
  const moveQuestion = (index: number, delta: number) =>
    setV((prev) => {
      const next = [...prev.questions];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...prev, questions: next };
    });

  const previewCard = (
    <div className="border-border/70 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <SkillTile skill={v.skill} className="size-14" />
        <div className="min-w-0 flex-1">
          <p className="text-navy font-bold">{v.title || "Titre de l'évaluation"}</p>
        </div>
        <span className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium">{typeLabel}</span>
      </div>
      <p className="text-navy/80 mt-3 text-sm leading-relaxed">
        {v.description || "La description apparaîtra ici."}
      </p>
      <ul className="text-muted mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        <li className="flex items-center gap-1.5">
          <Clock className="size-4" aria-hidden /> {v.durationMinutes} minutes
        </li>
        <li className="flex items-center gap-1.5">
          <Layers className="size-4" aria-hidden /> {SKILL_LEVEL_LABELS[v.difficulty]}
        </li>
        <li className="flex items-center gap-1.5">
          <Globe className="size-4" aria-hidden /> {v.language}
        </li>
        <li className="flex items-center gap-1.5">
          <FileText className="size-4" aria-hidden /> {v.questions.length} question
          {v.questions.length > 1 ? "s" : ""}
        </li>
      </ul>
    </div>
  );

  const err = (key: string) =>
    errors[key] ? (
      <p role="alert" className="text-danger text-sm">
        {errors[key]}
      </p>
    ) : null;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 space-y-6">
        <WizardHeader
          trail={[
            { label: "Évaluations", href: "/business/evaluations" },
            { label: editing ? "Modifier l'évaluation" : "Créer une évaluation" },
          ]}
          title={editing ? "Modifier l'évaluation" : "Créer une évaluation"}
          description="Concevez une évaluation pour mesurer les compétences des candidats."
          backHref="/business/evaluations"
        />
        <Stepper steps={STEPS} current={step} />

        {step === 0 && (
          <Panel className="p-6">
            <h2 className="text-navy text-xl font-bold">Informations générales</h2>
            <p className="text-muted text-sm">Définissez les détails de votre évaluation.</p>
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="eval-title">
                    Titre de l&apos;évaluation <span className="text-danger">*</span>
                  </Label>
                  <input
                    id="eval-title"
                    value={v.title}
                    maxLength={MAX_TITLE}
                    aria-invalid={Boolean(errors.title)}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Ex : Power Apps - Niveau intermédiaire"
                    className={field}
                  />
                  <p className="text-muted text-right text-xs">
                    {v.title.length}/{MAX_TITLE}
                  </p>
                  {err("title")}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eval-skill">
                    Compétence principale <span className="text-danger">*</span>
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-2 left-2.5">
                      <SkillTile skill={v.skill} className="size-7 rounded-lg" />
                    </span>
                    <input
                      id="eval-skill"
                      list="eval-skill-list"
                      value={v.skill}
                      maxLength={60}
                      aria-invalid={Boolean(errors.skill)}
                      onChange={(e) => set("skill", e.target.value)}
                      placeholder="Choisir ou saisir une compétence"
                      className={cn(field, "pl-12")}
                    />
                    <datalist id="eval-skill-list">
                      {SKILL_CATALOG.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                  {err("skill")}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eval-description">
                  Description <span className="text-danger">*</span>
                </Label>
                <textarea
                  id="eval-description"
                  value={v.description}
                  maxLength={MAX_DESCRIPTION}
                  rows={4}
                  aria-invalid={Boolean(errors.description)}
                  onChange={(e) => set("description", e.target.value)}
                  className="border-border focus-visible:ring-brand/40 aria-[invalid=true]:border-danger w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2"
                />
                <p className="text-muted text-right text-xs">
                  {v.description.length}/{MAX_DESCRIPTION}
                </p>
                {err("description")}
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  Type d&apos;évaluation <span className="text-danger">*</span>
                </legend>
                <div className="grid gap-3 md:grid-cols-3">
                  {EVALUATION_TYPES.map((t) => {
                    const Icon = t === "TECHNICAL" ? Code2 : t === "TRANSVERSAL" ? Layers : ShieldCheck;
                    return (
                      <label
                        key={t}
                        className={cn(
                          "focus-within:ring-brand/40 flex cursor-pointer items-start gap-3 rounded-xl border p-3 focus-within:ring-2",
                          v.type === t ? "border-brand bg-blue-50/60" : "border-border",
                        )}
                      >
                        <input
                          type="radio"
                          name="eval-type"
                          className="sr-only"
                          checked={v.type === t}
                          onChange={() => set("type", t)}
                        />
                        <Icon className="text-brand mt-0.5 size-6 shrink-0" aria-hidden />
                        <span className="text-sm">
                          <span className="text-navy block font-semibold">
                            {EVALUATION_TYPE_LABELS[t].title}
                          </span>
                          <span className="text-muted block text-xs">
                            {EVALUATION_TYPE_LABELS[t].description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="eval-difficulty">
                    Niveau de difficulté <span className="text-danger">*</span>
                  </Label>
                  <select
                    id="eval-difficulty"
                    value={v.difficulty}
                    onChange={(e) => set("difficulty", e.target.value as SkillLevel)}
                    className={field}
                  >
                    {SKILL_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {SKILL_LEVEL_LABELS[l]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eval-duration">
                    Durée estimée <span className="text-danger">*</span>
                  </Label>
                  <select
                    id="eval-duration"
                    value={v.durationMinutes}
                    onChange={(e) => set("durationMinutes", Number(e.target.value))}
                    className={field}
                  >
                    {EVALUATION_DURATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} minutes
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eval-language">
                    Langue du test <span className="text-danger">*</span>
                  </Label>
                  <select
                    id="eval-language"
                    value={v.language}
                    onChange={(e) => set("language", e.target.value)}
                    className={field}
                  >
                    {EVALUATION_LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eval-count">Nombre de questions</Label>
                  <input
                    id="eval-count"
                    readOnly
                    value={`${v.questions.length} (défini à l'étape suivante)`}
                    className={cn(field, "bg-slate-50")}
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <Link
                href="/business/evaluations"
                className="border-brand/40 text-brand flex h-11 items-center rounded-xl border bg-white px-6 text-sm font-semibold hover:bg-blue-50"
              >
                Annuler
              </Link>
              <button
                type="button"
                onClick={() => check(0) && setStep(1)}
                className="bg-brand h-11 rounded-xl px-6 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Suivant →
              </button>
            </div>
          </Panel>
        )}

        {step === 1 && (
          <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
            <Panel className="p-4">
              <h2 className="text-navy font-bold">Ajouter une question</h2>
              <p className="text-muted mt-1 text-xs">Choisissez le type de question à ajouter.</p>
              <ul className="mt-3 space-y-2">
                {QUESTION_TYPES.map((t) => {
                  const { icon: Icon, tone } = QUESTION_ICONS[t];
                  return (
                    <li key={t}>
                      <button
                        type="button"
                        onClick={() => addQuestion(t)}
                        className="border-border hover:border-brand/50 flex w-full items-center gap-3 rounded-xl border p-2.5 text-left hover:bg-blue-50/40"
                      >
                        <span
                          className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tone)}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 text-sm">
                          <span className="text-navy block leading-tight font-semibold">
                            {QUESTION_TYPE_LABELS[t].title}
                          </span>
                          <span className="text-muted block truncate text-[11px]">
                            {QUESTION_TYPE_LABELS[t].description}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-navy text-xl font-bold">Contenu du test</h2>
                  <p className="text-muted text-sm">
                    Ajoutez et organisez les questions de votre évaluation.
                  </p>
                </div>
                <p className="text-muted text-xs">
                  {v.questions.length} question{v.questions.length > 1 ? "s" : ""} · {points} point
                  {points > 1 ? "s" : ""}
                </p>
              </div>
              {err("questions")}
              {v.questions.length === 0 && !editingQuestion && (
                <p className="text-muted mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm">
                  Aucune question pour l&apos;instant. Choisissez un type de question à gauche pour commencer.
                </p>
              )}
              <ol className="mt-4 divide-y divide-slate-100">
                {v.questions.map((q, i) => {
                  const { icon: Icon, tone } = QUESTION_ICONS[q.type];
                  if (editingQuestion && !editingQuestion.isNew && editingQuestion.question.id === q.id) {
                    return (
                      <li key={q.id} className="py-3">
                        <QuestionEditor
                          question={editingQuestion.question}
                          onSave={saveQuestion}
                          onCancel={() => setEditingQuestion(null)}
                        />
                      </li>
                    );
                  }
                  return (
                    <li
                      key={q.id}
                      className={cn("flex items-center gap-3 py-3", selected === q.id && "bg-blue-50/40")}
                    >
                      <span className="text-navy flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">
                        {i + 1}
                      </span>
                      <span
                        className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tone)}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelected(q.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="text-navy block truncate text-sm font-medium">{q.prompt}</span>
                        <span className="text-muted block text-xs">{QUESTION_TYPE_LABELS[q.type].title}</span>
                      </button>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-semibold",
                          DIFFICULTY_TONES[q.difficulty],
                        )}
                      >
                        {QUESTION_DIFFICULTY_LABELS[q.difficulty]}
                      </span>
                      <span className="text-navy w-12 text-right text-xs font-medium">
                        {q.points} pt{q.points > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center">
                        <button
                          type="button"
                          aria-label={`Monter la question ${i + 1}`}
                          disabled={i === 0}
                          onClick={() => moveQuestion(i, -1)}
                          className="text-muted hover:text-navy p-1 disabled:opacity-30"
                        >
                          <ArrowUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Descendre la question ${i + 1}`}
                          disabled={i === v.questions.length - 1}
                          onClick={() => moveQuestion(i, 1)}
                          className="text-muted hover:text-navy p-1 disabled:opacity-30"
                        >
                          <ArrowDown className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Modifier la question ${i + 1}`}
                          onClick={() => setEditingQuestion({ question: q, isNew: false })}
                          className="text-muted hover:text-navy p-1"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Dupliquer la question ${i + 1}`}
                          onClick={() =>
                            setV((p) => ({
                              ...p,
                              questions: [
                                ...p.questions.slice(0, i + 1),
                                { ...q, id: crypto.randomUUID() },
                                ...p.questions.slice(i + 1),
                              ],
                            }))
                          }
                          className="text-muted hover:text-navy p-1"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Supprimer la question ${i + 1}`}
                          onClick={() =>
                            setV((p) => ({ ...p, questions: p.questions.filter((x) => x.id !== q.id) }))
                          }
                          className="text-muted hover:text-danger p-1"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ol>
              {editingQuestion?.isNew && (
                <div className="mt-4">
                  <QuestionEditor
                    key={editingQuestion.question.id}
                    question={editingQuestion.question}
                    onSave={saveQuestion}
                    onCancel={() => setEditingQuestion(null)}
                  />
                </div>
              )}
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addQuestion("SINGLE")}
                  className="border-brand text-brand flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50"
                >
                  <Plus className="size-4" aria-hidden /> Ajouter une question
                </button>
                <p className="text-muted text-sm">
                  Total : {v.questions.length} question{v.questions.length > 1 ? "s" : ""} (
                  {v.durationMinutes} minutes)
                </p>
              </div>
              <WizardNav onPrevious={() => setStep(0)} onNext={() => check(1) && setStep(2)} />
            </Panel>
          </div>
        )}

        {step === 2 && (
          <Panel className="p-6">
            <h2 className="text-navy text-xl font-bold">Paramètres de l&apos;évaluation</h2>
            <p className="text-muted text-sm">
              Configurez l&apos;expérience de passage, le scoring et les règles de validation.
            </p>
            {err("settings")}
            <div className="mt-5 space-y-7">
              <section className="space-y-4">
                <SectionTitle n={1}>Durée et expérience</SectionTitle>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="set-duration">
                      Durée totale <span className="text-danger">*</span>
                    </Label>
                    <select
                      id="set-duration"
                      value={v.durationMinutes}
                      onChange={(e) => set("durationMinutes", Number(e.target.value))}
                      className={field}
                    >
                      {EVALUATION_DURATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d} minutes
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="set-display">Affichage des questions</Label>
                    <select
                      id="set-display"
                      value={st.display}
                      onChange={(e) => setting("display", e.target.value as EvaluationSettings["display"])}
                      className={field}
                    >
                      <option value="ONE_BY_ONE">Une par une</option>
                      <option value="ALL">Toutes sur une page</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="set-navigation">Navigation</Label>
                    <select
                      id="set-navigation"
                      value={st.navigation}
                      onChange={(e) =>
                        setting("navigation", e.target.value as EvaluationSettings["navigation"])
                      }
                      className={field}
                    >
                      <option value="FREE">Libre</option>
                      <option value="LINEAR">Linéaire (sans retour)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="set-attempts">
                      Nombre de tentatives <span className="text-danger">*</span>
                    </Label>
                    <select
                      id="set-attempts"
                      value={st.attempts}
                      onChange={(e) => setting("attempts", Number(e.target.value))}
                      className={field}
                    >
                      {ATTEMPT_LIMITS.map((n) => (
                        <option key={n} value={n}>
                          {ATTEMPT_LABELS[n]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Mode de passage</span>
                    <p className="border-border flex h-11 items-center rounded-xl border bg-slate-50 px-4 text-sm">
                      En ligne (sécurisé)
                    </p>
                    <p className="text-muted text-[11px]">Le test se passe sur la plateforme SkillPass</p>
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Appareils autorisés</legend>
                    <div className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1">
                      {(
                        [
                          ["computer", "Ordinateur"],
                          ["tablet", "Tablette"],
                          ["mobile", "Mobile"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={st.devices[key]}
                            onChange={(e) => setting("devices", { ...st.devices, [key]: e.target.checked })}
                            className="accent-brand size-4"
                          />{" "}
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <SwitchRow
                    title="Limiter le temps par question"
                    text="Temps maximum accordé pour chaque question"
                    checked={st.timePerQuestion !== null}
                    onChange={(on) => setting("timePerQuestion", on ? 60 : null)}
                  />
                  {st.timePerQuestion !== null && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        aria-label="Secondes par question"
                        type="number"
                        min={10}
                        max={3600}
                        value={st.timePerQuestion}
                        onChange={(e) => setting("timePerQuestion", Number(e.target.value))}
                        className="border-border h-10 w-24 rounded-xl border px-3 text-sm"
                      />{" "}
                      secondes
                    </label>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <SectionTitle n={2}>Scoring et validation</SectionTitle>
                <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_1.4fr]">
                  <div className="space-y-2">
                    <Label htmlFor="set-pass">
                      Score de réussite <span className="text-danger">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="set-pass"
                        type="number"
                        min={1}
                        max={100}
                        value={st.passScore}
                        onChange={(e) => setting("passScore", Number(e.target.value))}
                        className={field}
                      />
                      <span className="text-muted text-sm">%</span>
                    </div>
                    <p className="text-muted text-[11px]">Pourcentage minimum pour réussir</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="set-weighting">Pondération des questions</Label>
                    <select
                      id="set-weighting"
                      value={st.weighting}
                      onChange={(e) =>
                        setting("weighting", e.target.value as EvaluationSettings["weighting"])
                      }
                      className={field}
                    >
                      {WEIGHTINGS.map((w) => (
                        <option key={w} value={w}>
                          {WEIGHTING_LABELS[w]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Afficher le score aux candidats</legend>
                    <div className="border-border flex overflow-hidden rounded-xl border text-xs font-medium">
                      {SHOW_SCORE_OPTIONS.map((o) => (
                        <label
                          key={o}
                          className={cn(
                            "flex-1 cursor-pointer px-2 py-3 text-center",
                            st.showScore === o ? "text-brand bg-blue-100" : "hover:bg-slate-50",
                          )}
                        >
                          <input
                            type="radio"
                            name="show-score"
                            className="sr-only"
                            checked={st.showScore === o}
                            onChange={() => setting("showScore", o)}
                          />
                          {SHOW_SCORE_LABELS[o]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </section>

              <section className="space-y-4">
                <SectionTitle n={3}>Sécurité et anti-fraude</SectionTitle>
                <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
                  <SwitchRow
                    title="Mélanger l'ordre des questions"
                    text="Affiche les questions dans un ordre aléatoire"
                    checked={st.shuffleQuestions}
                    onChange={(on) => setting("shuffleQuestions", on)}
                  />
                  <SwitchRow
                    title="Limiter le copier-coller"
                    text="Désactive le copier-coller dans le test"
                    checked={st.limitCopyPaste}
                    onChange={(on) => setting("limitCopyPaste", on)}
                  />
                  <SwitchRow
                    title="Mélanger l'ordre des réponses"
                    text="Affiche les choix de réponses de façon aléatoire"
                    checked={st.shuffleAnswers}
                    onChange={(on) => setting("shuffleAnswers", on)}
                  />
                  <SwitchRow
                    title="Surveillance par webcam"
                    text="Bientôt disponible"
                    checked={false}
                    onChange={() => undefined}
                    disabled
                  />
                  <SwitchRow
                    title="Mode plein écran"
                    text="Demande le plein écran pendant l'évaluation"
                    checked={st.fullscreen}
                    onChange={(on) => setting("fullscreen", on)}
                  />
                  <div>
                    <SwitchRow
                      title="Plage horaire de passage"
                      text="Définir des dates et heures spécifiques"
                      checked={st.windowStart !== null}
                      onChange={(on) => {
                        setting("windowStart", on ? `${todayLocal()}T08:00` : null);
                        setting("windowEnd", on ? `${todayLocal()}T18:00` : null);
                      }}
                    />
                    {st.windowStart !== null && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <label className="text-xs">
                          Début
                          <input
                            type="datetime-local"
                            value={st.windowStart}
                            onChange={(e) => setting("windowStart", e.target.value || null)}
                            className="border-border mt-1 h-10 w-full rounded-xl border px-3 text-sm"
                          />
                        </label>
                        <label className="text-xs">
                          Fin
                          <input
                            type="datetime-local"
                            value={st.windowEnd ?? ""}
                            onChange={(e) => setting("windowEnd", e.target.value || null)}
                            className="border-border mt-1 h-10 w-full rounded-xl border px-3 text-sm"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-muted text-xs">
                  Ces protections limitent la triche sans l&apos;empêcher totalement : elles ne remplacent pas
                  une surveillance humaine.
                </p>
              </section>

              <section className="space-y-4">
                <SectionTitle n={4}>Certificat et badges</SectionTitle>
                <div className="grid items-start gap-x-8 gap-y-4 md:grid-cols-2">
                  <SwitchRow
                    title="Délivrer un certificat"
                    text="Attribue un certificat en cas de réussite"
                    checked={st.certificate}
                    onChange={(on) => setting("certificate", on)}
                  />
                  <SwitchRow
                    title="Partager les résultats avec l'entreprise"
                    text="Les résultats seront visibles dans votre espace entreprise"
                    checked={st.shareWithOrg}
                    onChange={(on) => setting("shareWithOrg", on)}
                  />
                  {st.certificate && (
                    <div className="space-y-2">
                      <Label htmlFor="set-badge">Badge associé</Label>
                      <input
                        id="set-badge"
                        value={st.badge}
                        maxLength={80}
                        onChange={(e) => setting("badge", e.target.value)}
                        placeholder={badge}
                        className={field}
                      />
                      <p className="text-muted text-[11px]">Le badge sera affiché sur le profil du talent</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
            <WizardNav onPrevious={() => setStep(1)} onNext={() => check(2) && setStep(3)} />
          </Panel>
        )}

        {step === 3 && (
          <Panel className="p-6">
            <h2 className="text-navy text-xl font-bold">Publication et finalisation</h2>
            <p className="text-muted text-sm">
              Vérifiez les informations de votre évaluation et choisissez les options de publication.
            </p>
            <div className="mt-5 space-y-7">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionTitle n={1}>Résumé de l&apos;évaluation</SectionTitle>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="border-brand/40 text-brand flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold hover:bg-blue-50"
                  >
                    <Pencil className="size-3.5" aria-hidden /> Modifier
                  </button>
                </div>
                {previewCard}
                <dl className="border-border/70 grid grid-cols-2 gap-4 rounded-xl border p-4 text-sm md:grid-cols-5">
                  {[
                    ["Durée", `${v.durationMinutes} minutes`],
                    ["Nombre de questions", String(v.questions.length)],
                    ["Niveau de difficulté", SKILL_LEVEL_LABELS[v.difficulty]],
                    ["Langue", v.language],
                    ["Mode de passage", "En ligne"],
                  ].map(([k, val]) => (
                    <div key={k}>
                      <dd className="text-navy font-semibold">{val}</dd>
                      <dt className="text-muted text-xs">{k}</dt>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="space-y-3">
                <SectionTitle n={2}>Options de publication</SectionTitle>
                <div className="grid gap-3 md:grid-cols-3">
                  {(
                    [
                      [
                        "NOW",
                        Globe,
                        "Publier maintenant",
                        "L'évaluation sera immédiatement disponible pour les candidats.",
                      ],
                      [
                        "SCHEDULED",
                        Clock,
                        "Programmer la publication",
                        "Choisissez une date et une heure de publication.",
                      ],
                      [
                        "DRAFT",
                        FileText,
                        "Enregistrer comme brouillon",
                        "Terminez plus tard. L'évaluation ne sera pas visible.",
                      ],
                    ] as const
                  ).map(([mode, Icon, title, text]) => (
                    <label
                      key={mode}
                      className={cn(
                        "focus-within:ring-brand/40 flex cursor-pointer flex-col gap-1 rounded-xl border p-3 focus-within:ring-2",
                        v.mode === mode ? "border-brand bg-blue-50/60" : "border-border",
                      )}
                    >
                      <input
                        type="radio"
                        name="publish-mode"
                        className="sr-only"
                        checked={v.mode === mode}
                        onChange={() => set("mode", mode)}
                      />
                      <Icon className="text-brand size-5" aria-hidden />
                      <span className="text-navy text-sm font-semibold">{title}</span>
                      <span className="text-muted text-xs">{text}</span>
                    </label>
                  ))}
                </div>
                {v.mode === "SCHEDULED" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pub-date">
                        Date de publication <span className="text-danger">*</span>
                      </Label>
                      <input
                        id="pub-date"
                        type="date"
                        value={v.publishDate}
                        onChange={(e) => set("publishDate", e.target.value)}
                        className={field}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pub-time">
                        Heure de publication <span className="text-danger">*</span>
                      </Label>
                      <input
                        id="pub-time"
                        type="time"
                        value={v.publishTime}
                        onChange={(e) => set("publishTime", e.target.value)}
                        className={field}
                      />
                    </div>
                  </div>
                )}
                {err("publish")}
              </section>

              <section className="space-y-3">
                <SectionTitle n={3}>Partage</SectionTitle>
                <div className="border-border/70 rounded-xl border p-4">
                  <p className="text-navy text-sm font-semibold">Lien de partage</p>
                  {shareUrl ? (
                    <>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          readOnly
                          aria-label="Lien de partage"
                          value={shareUrl}
                          onFocus={(e) => e.currentTarget.select()}
                          className="border-border h-10 min-w-0 flex-1 rounded-xl border bg-slate-50 px-3 text-xs"
                        />
                        <button
                          type="button"
                          aria-label="Copier le lien"
                          onClick={() => {
                            void navigator.clipboard?.writeText(shareUrl).then(() => {
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            });
                          }}
                          className="border-border flex size-10 items-center justify-center rounded-xl border hover:bg-slate-50"
                        >
                          {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                        </button>
                      </div>
                      <p className="text-muted mt-2 text-xs">
                        Seuls les candidats connectés à SkillPass peuvent passer le test, et seulement une
                        fois l&apos;évaluation publiée.
                      </p>
                      <p className="mt-3 flex items-center gap-3 text-sm">
                        <span className="text-navy font-medium">Partager sur</span>
                        <a
                          className="text-brand font-bold hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        >
                          LinkedIn
                        </a>
                        <a
                          className="text-brand font-bold hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
                        >
                          X
                        </a>
                        <a
                          className="text-brand font-bold hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                        >
                          Facebook
                        </a>
                        <a
                          className="text-brand flex items-center gap-1 font-bold hover:underline"
                          href={`mailto:?subject=${encodeURIComponent(v.title)}&body=${encodeURIComponent(shareUrl)}`}
                        >
                          <Mail className="size-4" aria-hidden /> E-mail
                        </a>
                      </p>
                    </>
                  ) : (
                    <p className="text-muted mt-1 text-sm">
                      Le lien à envoyer à vos candidats est créé dès l&apos;enregistrement de
                      l&apos;évaluation.
                    </p>
                  )}
                </div>
              </section>
            </div>
            {serverError && (
              <p role="alert" className="text-danger mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm">
                {serverError}
              </p>
            )}
            <WizardNav
              onPrevious={() => setStep(2)}
              onNext={finish}
              pending={pending}
              nextLabel={
                v.mode === "DRAFT"
                  ? "Enregistrer le brouillon"
                  : v.mode === "SCHEDULED"
                    ? "Programmer l'évaluation"
                    : alreadyPublished
                      ? "Enregistrer les modifications"
                      : "Publier l'évaluation"
              }
              nextIcon={v.mode === "DRAFT" ? undefined : <Send className="size-4" aria-hidden />}
            />
          </Panel>
        )}
        {step < 3 && serverError && (
          <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
            {serverError}
          </p>
        )}
      </div>

      <aside className="space-y-5 xl:pt-1">
        {step < 3 && (
          <InfoBox tone="tip" title={TIPS[step]!.title}>
            <ul className="mt-1 space-y-2">
              {TIPS[step]!.items.map((t) => (
                <li key={t} className="text-navy flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </InfoBox>
        )}

        {step === 0 && <PreviewPanel title="Aperçu de l'évaluation">{previewCard}</PreviewPanel>}

        {step === 1 && (
          <>
            <PreviewPanel title="Aperçu de la question sélectionnée">
              {previewQuestion ? (
                <div className="border-border/70 rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-brand rounded-md bg-blue-50 px-2 py-0.5 font-medium">
                      {QUESTION_TYPE_LABELS[previewQuestion.type].title}
                    </span>
                    <span
                      className={cn(
                        "ml-auto rounded-md px-2 py-0.5 font-semibold",
                        DIFFICULTY_TONES[previewQuestion.difficulty],
                      )}
                    >
                      {QUESTION_DIFFICULTY_LABELS[previewQuestion.difficulty]}
                    </span>
                    <span className="text-navy font-medium">{previewQuestion.points} pts</span>
                  </div>
                  <p className="text-navy mt-3 text-sm font-semibold">
                    {v.questions.indexOf(previewQuestion) + 1}. {previewQuestion.prompt}
                  </p>
                  {previewQuestion.options.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm">
                      {previewQuestion.options.map((o, i) => (
                        <li key={o + i} className="flex items-center gap-2.5">
                          <span
                            aria-hidden
                            className={cn(
                              "flex size-4 items-center justify-center border-2",
                              previewQuestion.type === "MULTIPLE" ? "rounded" : "rounded-full",
                              previewQuestion.correct.includes(i)
                                ? "border-brand bg-brand"
                                : "border-slate-300",
                            )}
                          >
                            {previewQuestion.correct.includes(i) && (
                              <span className="size-1.5 rounded-full bg-white" />
                            )}
                          </span>
                          {o}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted mt-3 rounded-lg bg-slate-50 p-3 text-xs">
                      Le candidat répond par écrit ou en joignant un fichier ; une personne de votre équipe
                      corrige.
                    </p>
                  )}
                  <p className="text-muted mt-3 text-[11px]">
                    Les bonnes réponses sont indiquées ici pour vous : le candidat ne les voit pas.
                  </p>
                </div>
              ) : (
                <p className="text-muted text-sm">Ajoutez une question pour la voir ici.</p>
              )}
            </PreviewPanel>
            <Panel className="p-5">
              <h2 className="text-navy font-bold">Répartition du test</h2>
              <div className="mt-4 flex items-center gap-4">
                <Donut
                  label="Répartition des types de questions"
                  center={v.questions.length}
                  caption="questions"
                  segments={mix.map((m, i) => ({
                    label: m.type,
                    value: m.count,
                    color: MIX_COLORS[i % MIX_COLORS.length]!,
                  }))}
                  size={120}
                />
                <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
                  {mix.map((m, i) => (
                    <li key={m.type} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: MIX_COLORS[i % MIX_COLORS.length] }}
                      />
                      <span className="text-navy truncate">
                        {QUESTION_TYPE_LABELS[m.type as QuestionType].title}
                      </span>
                      <span className="text-navy ml-auto font-semibold">{m.percent}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </>
        )}

        {step === 2 && (
          <>
            <PreviewPanel title="Aperçu des paramètres">
              <dl className="divide-y divide-slate-100 text-sm">
                {[
                  ["Durée", `${v.durationMinutes} minutes`],
                  ["Nombre de questions", `${v.questions.length} questions`],
                  ["Mode de passage", "En ligne (sécurisé)"],
                  ["Nombre de tentatives", ATTEMPT_LABELS[st.attempts]!],
                  ["Score de réussite", `${st.passScore}%`],
                  ["Affichage du score", SHOW_SCORE_LABELS[st.showScore]],
                  [
                    "Sécurité",
                    [
                      st.shuffleQuestions && "questions mélangées",
                      st.shuffleAnswers && "réponses mélangées",
                      st.fullscreen && "plein écran",
                      st.limitCopyPaste && "anti-copie",
                    ]
                      .filter(Boolean)
                      .join(", ") || "Aucune",
                  ],
                  ["Certificat", st.certificate ? badge : "Aucun"],
                ].map(([k, val]) => (
                  <div key={k} className="grid grid-cols-[1fr_1.4fr] gap-3 py-2.5">
                    <dt className="text-navy font-medium">{k}</dt>
                    <dd className="text-muted">{val}</dd>
                  </div>
                ))}
              </dl>
            </PreviewPanel>
            {st.certificate && (
              <Panel className="p-5">
                <h2 className="text-navy font-bold">Aperçu du badge</h2>
                <div className="border-border/70 mt-4 flex items-center gap-4 rounded-xl border p-4">
                  <SkillTile skill={v.skill} className="size-16" />
                  <div>
                    <p className="text-navy font-bold">{badge}</p>
                    <p className="text-muted text-xs">Délivré lors de la réussite de cette évaluation</p>
                    <span className="text-brand mt-2 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium">
                      Niveau {SKILL_LEVEL_LABELS[v.difficulty].toLowerCase()}
                    </span>
                  </div>
                </div>
              </Panel>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <PreviewPanel title="Aperçu de l'évaluation">{previewCard}</PreviewPanel>
            <Panel className="p-5">
              <h2 className="text-navy font-bold">Avant de publier</h2>
              <ul className="mt-3 space-y-2.5 text-sm">
                {[
                  [
                    "Titre et description clairs",
                    v.title.trim().length >= 3 && v.description.trim().length >= 20,
                  ],
                  ["Compétence principale choisie", Boolean(v.skill.trim())],
                  ["Au moins une question", v.questions.length > 0],
                  ["Une réponse correcte par question à choix", true],
                  [
                    "Paramètres de sécurité configurés",
                    st.shuffleQuestions || st.fullscreen || st.limitCopyPaste,
                  ],
                ].map(([label, ok]) => (
                  <li key={label as string} className="flex items-center gap-2.5">
                    <CheckCircle2
                      className={cn("size-5", ok ? "text-green-600" : "text-slate-300")}
                      aria-hidden
                    />
                    <span className={ok ? "text-navy" : "text-muted"}>{label as string}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel className="p-5">
              <h2 className="text-navy font-bold">Prochaines étapes</h2>
              <ol className="mt-3 space-y-3 text-sm">
                {[
                  "Publiez l'évaluation",
                  "Partagez le lien avec vos candidats",
                  "Suivez les résultats dans l'onglet Résultats",
                ].map((t, i) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="text-brand flex size-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-navy">{t}</span>
                  </li>
                ))}
              </ol>
              {alreadyPublished && (
                <p className="text-muted mt-3 text-xs">
                  Les candidats qui ont déjà passé le test conservent leur résultat.
                </p>
              )}
            </Panel>
          </>
        )}
      </aside>
    </div>
  );
}
