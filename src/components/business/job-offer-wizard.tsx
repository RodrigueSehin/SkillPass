"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Banknote,
  Briefcase,
  CalendarDays,
  Check,
  ChevronRight,
  Eye,
  Globe,
  Home,
  Lightbulb,
  Lock,
  Network,
  Mail,
  MapPin,
  Send,
  Search,
  Users,
  UsersRound,
  Link2,
  ListChecks,
  ClipboardCheck,
  BellRing,
} from "lucide-react";
import { saveJobOfferAction } from "@/app/business/offres/actions";
import { Label } from "@/components/ui/label";
import { CERTIFICATIONS, SOFT_SKILLS, SUGGESTED_TECH_SKILLS, TECH_SKILLS } from "@/config/job-catalog";
import { salaryLabel } from "@/lib/business/job-offer-mapping";
import { stripFormatting } from "@/lib/rich-text";
import { cn } from "@/lib/utils/cn";
import {
  APPLICATION_MODES,
  APPLICATION_MODE_LABELS,
  AVAILABILITIES,
  AVAILABILITY_LABELS,
  CURRENCIES,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  JOB_CHANNELS,
  JOB_CHANNEL_LABELS,
  JOB_CONTRACTS,
  JOB_CONTRACT_LABELS,
  JOB_WORK_MODES,
  JOB_WORK_MODE_LABELS,
  MOBILITIES,
  MOBILITY_LABELS,
  PERMITS,
  PUBLICATION_DURATIONS,
  VISIBILITIES,
  VISIBILITY_LABELS,
  type JobChannel,
  type JobOfferDTO,
} from "@/types/job-offer";
import { MarkdownEditor } from "./markdown-editor";
import { OrgLogo } from "./org-logo";
import { SuggestedTags, TagInput } from "./tag-input";
import { InfoBox, PreviewPanel, Stepper, WizardNav } from "./wizard-parts";
import { Panel } from "./ui";

const STEPS = [
  { title: "Informations générales", subtitle: "Décrivez le poste" },
  { title: "Compétences & critères", subtitle: "Définissez le profil" },
  { title: "Diffusion", subtitle: "Publiez et suivez" },
];

const field =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2 aria-[invalid=true]:border-danger";
const MAX_TITLE = 100;
const MAX_DESCRIPTION = 2000;

const TIPS: string[][] = [
  [
    "Utilisez un titre clair et précis",
    "Détaillez les missions et les responsabilités",
    "Spécifiez les compétences clés requises",
    "Indiquez le mode de travail et la localisation",
    "Ajoutez la fourchette salariale (recommandé)",
  ],
  [
    "Sélectionnez uniquement les compétences réellement requises",
    "Ajoutez des compétences comportementales pertinentes",
    "Les certifications augmentent la qualité des candidatures",
    "Soyez réaliste sur le niveau d'expérience",
    "Plus votre description est précise, meilleurs seront les matchs",
  ],
  [
    "Choisissez les bons canaux de diffusion",
    "Définissez une période de publication adaptée",
    "Utilisez une description claire et attractive",
    "Activez les notifications aux talents pertinents",
    "Suivez les performances de votre offre",
  ],
];

const day = (offset = 0) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const longDay = (iso: string) =>
  iso
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${iso}T00:00:00Z`))
    : "—";

interface Values {
  title: string;
  description: string;
  contract: string;
  location: string;
  workMode: string;
  departmentId: string;
  experience: string;
  positions: string;
  deadline: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  skills: string[];
  softSkills: string[];
  certifications: string[];
  education: string;
  french: boolean;
  english: boolean;
  otherLanguageOn: boolean;
  otherLanguage: string;
  permit: string;
  mobility: string;
  availability: string;
  visibility: string;
  publishOn: string;
  durationMonths: string;
  channels: JobChannel[];
  applicationMode: string;
}

function initial(o: JobOfferDTO | undefined, defaultLocation: string): Values {
  const known = new Set(["Français", "Anglais"]);
  return {
    title: o?.title ?? "",
    description: o?.description ?? "",
    contract: o?.contract ?? "CDI",
    location: o?.location ?? defaultLocation,
    workMode: o?.workMode ?? "HYBRID",
    departmentId: o?.departmentId ?? "",
    experience: o?.experience ?? "3 à 5 ans",
    positions: String(o?.positions ?? 1),
    deadline: o?.deadline ?? day(30),
    salaryMin: o?.salaryMin != null ? String(o.salaryMin) : "",
    salaryMax: o?.salaryMax != null ? String(o.salaryMax) : "",
    currency: o?.currency ?? "FCFA",
    skills: o?.skills ?? [],
    softSkills: o?.softSkills ?? [],
    certifications: o?.certifications ?? [],
    education: o?.education ?? "Licence / Bac+3",
    french: o ? o.languages.includes("Français") : true,
    english: o ? o.languages.includes("Anglais") : true,
    otherLanguageOn: Boolean(o?.otherLanguage) || Boolean(o?.languages.some((l) => !known.has(l))),
    otherLanguage: o?.otherLanguage ?? "",
    permit: o?.permit ?? "Aucun",
    mobility: o?.mobility ?? "NONE",
    availability: o?.availability ?? "ASAP",
    visibility: o?.visibility ?? "PUBLIC",
    publishOn: o?.publishOn ?? day(),
    durationMonths: String(o?.durationMonths ?? 2),
    channels: o?.channels ?? ["PLATFORM", "EMAIL"],
    applicationMode: o?.applicationMode ?? "SIMPLE",
  };
}

const CHANNEL_ICONS: Record<JobChannel, { icon: typeof Globe; tone: string }> = {
  PLATFORM: { icon: Globe, tone: "bg-orange-100 text-orange-600" },
  LINKEDIN: { icon: Network, tone: "bg-blue-100 text-brand" },
  EMAIL: { icon: Mail, tone: "bg-blue-50 text-brand" },
  CAREER_SITE: { icon: Link2, tone: "bg-slate-100 text-slate-600" },
};
const VISIBILITY_ICONS = { PUBLIC: Globe, RESTRICTED: UsersRound, INTERNAL: Lock } as const;
const APPLICATION_ICONS = [ClipboardCheck, ListChecks, BarChart3] as const;

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-brand" : "bg-slate-300",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 size-6 rounded-full bg-white shadow transition-all",
          checked ? "left-[1.4rem]" : "left-0.5",
        )}
      />
    </button>
  );
}

function IconField({ icon: Icon, children }: { icon: typeof Globe; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="text-brand pointer-events-none absolute top-3.5 left-3.5 z-10 size-4" aria-hidden />
      {children}
    </div>
  );
}

export function JobOfferWizard({
  offer,
  organization,
  departments,
}: {
  /** Set when editing an existing offer. */
  offer?: JobOfferDTO;
  organization: { name: string; industry: string | null; address: string | null; logoVersion: string | null };
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const editing = Boolean(offer);
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Values>(() => initial(offer, organization.address ?? "Abidjan, Côte d'Ivoire"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };

  const department = departments.find((d) => d.id === v.departmentId);
  const languages = [
    v.french && "Français",
    v.english && "Anglais",
    v.otherLanguageOn && v.otherLanguage.trim() && v.otherLanguage.trim(),
  ].filter(Boolean) as string[];
  const salary = salaryLabel({
    salaryMin: v.salaryMin ? Number(v.salaryMin) : null,
    salaryMax: v.salaryMax ? Number(v.salaryMax) : null,
    currency: v.currency,
  });
  const alreadyPublished = offer?.status === "PUBLISHED";

  function check(forStep: number) {
    const found: Record<string, string> = {};
    if (forStep === 0) {
      if (v.title.trim().length < 3) found.title = "Le titre du poste est requis (3 caractères minimum)";
      if (!v.location.trim()) found.location = "La localisation est requise";
      if (!v.departmentId) found.departmentId = "Choisissez le service ou département";
      if (!(Number(v.positions) >= 1)) found.positions = "Au moins 1 poste";
      if (v.salaryMin && v.salaryMax && Number(v.salaryMin) > Number(v.salaryMax))
        found.salaryMax = "Le minimum dépasse le maximum";
    }
    if (forStep === 1 && v.skills.length === 0) found.skills = "Ajoutez au moins une compétence technique";
    if (forStep === 2) {
      if (!v.deadline) found.deadline = "La date limite est requise";
      if (v.deadline && v.publishOn && v.deadline < v.publishOn)
        found.deadline = "La date limite précède la publication";
      if (v.channels.length === 0) found.channels = "Choisissez au moins un canal de diffusion";
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  function payload() {
    return {
      title: v.title,
      description: v.description,
      contract: v.contract,
      location: v.location,
      workMode: v.workMode,
      departmentId: v.departmentId,
      experience: v.experience,
      positions: v.positions,
      deadline: v.deadline,
      salaryMin: v.salaryMin,
      salaryMax: v.salaryMax,
      currency: v.currency,
      skills: v.skills,
      softSkills: v.softSkills,
      certifications: v.certifications,
      education: v.education,
      languages: [v.french && "Français", v.english && "Anglais"].filter(Boolean),
      otherLanguage: v.otherLanguageOn ? v.otherLanguage : "",
      permit: v.permit,
      mobility: v.mobility,
      availability: v.availability,
      visibility: v.visibility,
      publishOn: v.publishOn,
      durationMonths: v.durationMonths,
      channels: v.channels,
      applicationMode: v.applicationMode,
    };
  }

  function save(publish: boolean) {
    setServerError(undefined);
    // A draft only needs a title; publishing needs every step to be complete.
    const ok = publish
      ? [0, 1, 2].every((s) => check(s) || (setStep(s), false))
      : v.title.trim().length >= 3 || (check(0), setStep(0), false);
    if (!ok) return;
    startTransition(async () => {
      const result = await saveJobOfferAction(offer?.id ?? null, payload(), publish);
      if (result.error) setServerError(result.error);
      else router.push("/business/offres");
    });
  }

  const tip = TIPS[step];

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0 space-y-6">
        <div>
          <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-2 text-sm">
            <Link href="/business/offres" className="hover:text-brand">
              Offres d&apos;emploi
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-navy font-medium">{editing ? "Modifier l'offre" : "Créer une offre"}</span>
          </nav>
          <h1 className="text-navy mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {editing ? "Modifier l'offre d'emploi" : "Créer une offre d'emploi"}
          </h1>
          <p className="text-muted mt-1 text-sm">
            Attirez les meilleurs talents en publiant une offre claire et détaillée.
          </p>
        </div>
        <Stepper steps={STEPS} current={step} />

        <Panel className="p-6">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-navy text-xl font-bold">Informations générales</h2>
              <div className="space-y-2">
                <Label htmlFor="job-title">
                  Titre du poste <span className="text-danger">*</span>
                </Label>
                <input
                  id="job-title"
                  value={v.title}
                  maxLength={MAX_TITLE}
                  aria-invalid={Boolean(errors.title)}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex : Power Platform Developer"
                  className={field}
                />
                <p className="text-muted text-right text-xs">
                  {v.title.length}/{MAX_TITLE}
                </p>
                {errors.title && (
                  <p role="alert" className="text-danger text-sm">
                    {errors.title}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-description">
                  Description du poste <span className="text-danger">*</span>
                </Label>
                <MarkdownEditor
                  id="job-description"
                  value={v.description}
                  onChange={(d) => set("description", d)}
                  maxLength={MAX_DESCRIPTION}
                />
                <p className="text-muted text-xs">
                  Les lignes commençant par un tiret deviennent les missions du poste.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="job-contract">
                    Type de contrat <span className="text-danger">*</span>
                  </Label>
                  <IconField icon={Briefcase}>
                    <select
                      id="job-contract"
                      value={v.contract}
                      onChange={(e) => set("contract", e.target.value)}
                      className={cn(field, "pl-10")}
                    >
                      {JOB_CONTRACTS.map((c) => (
                        <option key={c} value={c}>
                          {JOB_CONTRACT_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </IconField>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-location">
                    Localisation <span className="text-danger">*</span>
                  </Label>
                  <IconField icon={MapPin}>
                    <input
                      id="job-location"
                      value={v.location}
                      aria-invalid={Boolean(errors.location)}
                      onChange={(e) => set("location", e.target.value)}
                      className={cn(field, "pl-10")}
                    />
                  </IconField>
                  {errors.location && (
                    <p role="alert" className="text-danger text-sm">
                      {errors.location}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-mode">Mode de travail</Label>
                  <IconField icon={Home}>
                    <select
                      id="job-mode"
                      value={v.workMode}
                      onChange={(e) => set("workMode", e.target.value)}
                      className={cn(field, "pl-10")}
                    >
                      {JOB_WORK_MODES.map((m) => (
                        <option key={m} value={m}>
                          {JOB_WORK_MODE_LABELS[m]}
                        </option>
                      ))}
                    </select>
                  </IconField>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="job-department">
                    Service / Département <span className="text-danger">*</span>
                  </Label>
                  <IconField icon={Briefcase}>
                    <select
                      id="job-department"
                      value={v.departmentId}
                      aria-invalid={Boolean(errors.departmentId)}
                      onChange={(e) => set("departmentId", e.target.value)}
                      className={cn(field, "pl-10")}
                    >
                      <option value="">Sélectionner un département</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </IconField>
                  {errors.departmentId && (
                    <p role="alert" className="text-danger text-sm">
                      {errors.departmentId}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-experience">
                    Niveau d&apos;expérience <span className="text-danger">*</span>
                  </Label>
                  <IconField icon={BarChart3}>
                    <select
                      id="job-experience"
                      value={v.experience}
                      onChange={(e) => set("experience", e.target.value)}
                      className={cn(field, "pl-10")}
                    >
                      {EXPERIENCE_LEVELS.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </IconField>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-positions">Nombre de postes</Label>
                  <IconField icon={Users}>
                    <input
                      id="job-positions"
                      type="number"
                      min={1}
                      value={v.positions}
                      aria-invalid={Boolean(errors.positions)}
                      onChange={(e) => set("positions", e.target.value)}
                      className={cn(field, "pl-10")}
                    />
                  </IconField>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-deadline">Date limite de candidature</Label>
                  <IconField icon={CalendarDays}>
                    <input
                      id="job-deadline"
                      type="date"
                      value={v.deadline}
                      onChange={(e) => set("deadline", e.target.value)}
                      className={cn(field, "pl-10")}
                    />
                  </IconField>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-salary-min">Fourchette salariale (optionnel)</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-40 flex-1">
                    <IconField icon={Banknote}>
                      <input
                        id="job-salary-min"
                        type="number"
                        min={0}
                        value={v.salaryMin}
                        onChange={(e) => set("salaryMin", e.target.value)}
                        placeholder="800 000"
                        className={cn(field, "pl-10")}
                      />
                    </IconField>
                  </div>
                  <span className="text-muted text-sm">à</span>
                  <input
                    aria-label="Salaire maximum"
                    type="number"
                    min={0}
                    value={v.salaryMax}
                    aria-invalid={Boolean(errors.salaryMax)}
                    onChange={(e) => set("salaryMax", e.target.value)}
                    placeholder="1 200 000"
                    className={cn(field, "min-w-40 flex-1")}
                  />
                  <select
                    aria-label="Devise"
                    value={v.currency}
                    onChange={(e) => set("currency", e.target.value)}
                    className={cn(field, "w-28")}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {errors.salaryMax && (
                  <p role="alert" className="text-danger text-sm">
                    {errors.salaryMax}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-navy text-xl font-bold">Compétences requises</h2>
              <div className="space-y-3">
                <Label htmlFor="job-skills">
                  Compétences techniques <span className="text-danger">*</span>
                </Label>
                <TagInput
                  id="job-skills"
                  label="Compétences techniques"
                  value={v.skills}
                  onChange={(s) => set("skills", s)}
                  catalog={TECH_SKILLS}
                  placeholder="Rechercher et sélectionner des compétences…"
                />
                {errors.skills && (
                  <p role="alert" className="text-danger text-sm">
                    {errors.skills}
                  </p>
                )}
                <p className="text-sm">Compétences suggérées</p>
                <SuggestedTags
                  suggestions={SUGGESTED_TECH_SKILLS}
                  value={v.skills}
                  onChange={(s) => set("skills", s)}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="job-soft">Compétences comportementales</Label>
                <TagInput
                  id="job-soft"
                  label="Compétences comportementales"
                  value={v.softSkills}
                  onChange={(s) => set("softSkills", s)}
                  catalog={SOFT_SKILLS}
                  placeholder="Ajouter une qualité…"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="job-certs">Certifications souhaitées</Label>
                <TagInput
                  id="job-certs"
                  label="Certifications"
                  value={v.certifications}
                  onChange={(s) => set("certifications", s)}
                  catalog={CERTIFICATIONS}
                  placeholder="Rechercher une certification…"
                  max={20}
                />
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-navy text-xl font-bold">Critères supplémentaires</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="job-education">Niveau d&apos;études</Label>
                    <select
                      id="job-education"
                      value={v.education}
                      onChange={(e) => set("education", e.target.value)}
                      className={field}
                    >
                      {EDUCATION_LEVELS.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="job-years">Années d&apos;expérience</Label>
                    <select
                      id="job-years"
                      value={v.experience}
                      onChange={(e) => set("experience", e.target.value)}
                      className={field}
                    >
                      {EXPERIENCE_LEVELS.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Langues requises</legend>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={v.french}
                          onChange={(e) => set("french", e.target.checked)}
                          className="accent-brand size-4"
                        />{" "}
                        Français
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={v.english}
                          onChange={(e) => set("english", e.target.checked)}
                          className="accent-brand size-4"
                        />{" "}
                        Anglais
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={v.otherLanguageOn}
                          onChange={(e) => set("otherLanguageOn", e.target.checked)}
                          className="accent-brand size-4"
                        />{" "}
                        Autres
                      </label>
                      <input
                        aria-label="Autre langue"
                        value={v.otherLanguage}
                        disabled={!v.otherLanguageOn}
                        onChange={(e) => set("otherLanguage", e.target.value)}
                        placeholder="Préciser…"
                        className="border-border h-10 w-36 rounded-xl border bg-white px-3 text-sm disabled:bg-slate-50"
                      />
                    </div>
                  </fieldset>
                  <div className="space-y-2">
                    <Label htmlFor="job-permit">Permis requis</Label>
                    <select
                      id="job-permit"
                      value={v.permit}
                      onChange={(e) => set("permit", e.target.value)}
                      className={field}
                    >
                      {PERMITS.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Mobilité / Déplacement</legend>
                    <div className="flex flex-wrap gap-4">
                      {MOBILITIES.map((m) => (
                        <label key={m} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="mobility"
                            checked={v.mobility === m}
                            onChange={() => set("mobility", m)}
                            className="accent-brand size-4"
                          />{" "}
                          {MOBILITY_LABELS[m]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Disponibilité</legend>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {AVAILABILITIES.map((a) => (
                        <label key={a} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="availability"
                            checked={v.availability === a}
                            onChange={() => set("availability", a)}
                            className="accent-brand size-4"
                          />{" "}
                          {AVAILABILITY_LABELS[a]}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-navy text-xl font-bold">Diffusion de l&apos;offre</h2>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  Visibilité de l&apos;offre <span className="text-danger">*</span>
                </legend>
                <div className="grid gap-3 md:grid-cols-3">
                  {VISIBILITIES.map((vis) => {
                    const Icon = VISIBILITY_ICONS[vis];
                    return (
                      <label
                        key={vis}
                        className={cn(
                          "focus-within:ring-brand/40 flex cursor-pointer items-start gap-3 rounded-xl border p-3 focus-within:ring-2",
                          v.visibility === vis ? "border-brand bg-blue-50/60" : "border-border",
                        )}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          className="sr-only"
                          checked={v.visibility === vis}
                          onChange={() => set("visibility", vis)}
                        />
                        <Icon className="text-brand mt-0.5 size-6 shrink-0" aria-hidden />
                        <span className="text-sm">
                          <span className="text-navy block font-semibold">
                            {VISIBILITY_LABELS[vis].title}
                          </span>
                          <span className="text-muted block text-xs">
                            {VISIBILITY_LABELS[vis].description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="job-publish">
                    Date de publication <span className="text-danger">*</span>
                  </Label>
                  <IconField icon={CalendarDays}>
                    <input
                      id="job-publish"
                      type="date"
                      value={v.publishOn}
                      onChange={(e) => set("publishOn", e.target.value)}
                      className={cn(field, "pl-10")}
                    />
                  </IconField>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-deadline-3">
                    Date limite de candidature <span className="text-danger">*</span>
                  </Label>
                  <IconField icon={CalendarDays}>
                    <input
                      id="job-deadline-3"
                      type="date"
                      value={v.deadline}
                      aria-invalid={Boolean(errors.deadline)}
                      onChange={(e) => set("deadline", e.target.value)}
                      className={cn(field, "pl-10")}
                    />
                  </IconField>
                  {errors.deadline && (
                    <p role="alert" className="text-danger text-sm">
                      {errors.deadline}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-duration">Durée de publication</Label>
                  <select
                    id="job-duration"
                    value={v.durationMonths}
                    onChange={(e) => set("durationMonths", e.target.value)}
                    className={field}
                  >
                    {PUBLICATION_DURATIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-navy font-bold">Canaux de diffusion</h3>
                <p className="text-muted text-sm">
                  Choisissez où diffuser votre offre pour maximiser sa visibilité.
                </p>
                <ul className="border-border/70 mt-3 divide-y divide-slate-100 rounded-xl border">
                  {JOB_CHANNELS.map((ch) => {
                    const { icon: Icon, tone } = CHANNEL_ICONS[ch];
                    const on = v.channels.includes(ch);
                    return (
                      <li key={ch} className="flex items-center gap-3 p-3">
                        <span
                          className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}
                        >
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="text-navy block font-semibold">
                            {JOB_CHANNEL_LABELS[ch].title}
                          </span>
                          <span className="text-muted block text-xs">
                            {JOB_CHANNEL_LABELS[ch].description}
                          </span>
                        </span>
                        {ch === "PLATFORM" && (
                          <span className="rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                            Recommandé
                          </span>
                        )}
                        <Switch
                          checked={on}
                          label={JOB_CHANNEL_LABELS[ch].title}
                          onChange={(next) =>
                            set("channels", next ? [...v.channels, ch] : v.channels.filter((x) => x !== ch))
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
                {errors.channels && (
                  <p role="alert" className="text-danger mt-2 text-sm">
                    {errors.channels}
                  </p>
                )}
                <p className="text-muted mt-2 text-xs">
                  Seule la diffusion sur la plateforme SkillPass est active pour l&apos;instant ; les autres
                  canaux sont enregistrés pour plus tard.
                </p>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-navy font-bold">Processus de candidature</legend>
                <p className="text-muted text-sm">
                  Configurez le parcours de candidature et les informations demandées.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {APPLICATION_MODES.map((m, i) => {
                    const Icon = APPLICATION_ICONS[i];
                    return (
                      <label
                        key={m}
                        className={cn(
                          "focus-within:ring-brand/40 flex cursor-pointer items-start gap-3 rounded-xl border p-3 focus-within:ring-2",
                          v.applicationMode === m ? "border-brand bg-blue-50/60" : "border-border",
                        )}
                      >
                        <input
                          type="radio"
                          name="application-mode"
                          className="sr-only"
                          checked={v.applicationMode === m}
                          onChange={() => set("applicationMode", m)}
                        />
                        <Icon className="text-brand mt-0.5 size-5 shrink-0" aria-hidden />
                        <span className="text-sm">
                          <span className="text-navy block font-semibold">
                            {APPLICATION_MODE_LABELS[m].title}
                          </span>
                          <span className="text-muted block text-xs">
                            {APPLICATION_MODE_LABELS[m].description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}

          {serverError && (
            <p role="alert" className="text-danger mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm">
              {serverError}
            </p>
          )}

          {step === 0 ? (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => save(false)}
                className="border-brand/40 text-brand h-11 rounded-xl border bg-white px-6 text-sm font-semibold hover:bg-blue-50 disabled:opacity-60"
              >
                {alreadyPublished ? "Enregistrer les modifications" : "Enregistrer comme brouillon"}
              </button>
              <button
                type="button"
                onClick={() => check(0) && setStep(1)}
                className="bg-brand flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Suivant <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <WizardNav
              onPrevious={() => setStep(step - 1)}
              onNext={() => (step === 2 ? save(true) : check(step) && setStep(step + 1))}
              nextLabel={
                step === 2
                  ? alreadyPublished
                    ? "Enregistrer et mettre à jour"
                    : "Publier l'offre"
                  : "Suivant"
              }
              nextIcon={step === 2 ? <Send className="size-4" aria-hidden /> : undefined}
              pending={pending}
              extra={
                step === 2 && !alreadyPublished ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => save(false)}
                    className="border-brand/40 text-brand h-11 rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-blue-50 disabled:opacity-60"
                  >
                    Enregistrer comme brouillon
                  </button>
                ) : undefined
              }
            />
          )}
        </Panel>
      </div>

      <aside className="space-y-5 xl:pt-1">
        <InfoBox
          tone="tip"
          title={
            [
              "Conseils pour une offre efficace",
              "Conseils pour bien définir le profil",
              "Conseils pour une bonne diffusion",
            ][step]
          }
        >
          <ul className="mt-1 space-y-2">
            {tip.map((t) => (
              <li key={t} className="text-navy flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </InfoBox>

        <PreviewPanel title="Aperçu de l'offre">
          <p className="text-muted mb-3 flex items-center gap-1.5 text-xs">
            <Eye className="size-3.5" aria-hidden /> Aperçu temps réel
          </p>
          <div className="border-border/70 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <OrgLogo name={organization.name} version={organization.logoVersion} className="size-12" />
              <div className="min-w-0 flex-1">
                <p className="text-navy font-bold">{organization.name}</p>
                <p className="text-muted text-xs">{organization.industry ?? ""}</p>
              </div>
              <span className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                {JOB_CONTRACT_LABELS[v.contract as keyof typeof JOB_CONTRACT_LABELS] ?? v.contract}
              </span>
            </div>
            <h3 className="text-navy mt-4 text-xl font-bold">{v.title || "Titre du poste"}</h3>
            <ul className="text-muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden /> {v.location.split(",")[0] || "—"}
              </li>
              <li className="flex items-center gap-1.5">
                <Home className="size-4" aria-hidden />{" "}
                {JOB_WORK_MODE_LABELS[v.workMode as keyof typeof JOB_WORK_MODE_LABELS] ?? "—"}
              </li>
              {step === 2 ? (
                <li className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden /> Publié le {longDay(v.publishOn)}
                </li>
              ) : (
                <li className="flex items-center gap-1.5">
                  <BarChart3 className="size-4" aria-hidden /> {v.experience}
                </li>
              )}
            </ul>
            {step >= 1 && v.skills.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {[...v.skills, ...v.certifications].slice(0, step === 2 ? 6 : 7).map((s) => (
                  <li key={s} className="text-brand rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium">
                    {s}
                  </li>
                ))}
                {v.skills.length + v.certifications.length > (step === 2 ? 6 : 7) && (
                  <li className="text-brand rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium">
                    +{v.skills.length + v.certifications.length - (step === 2 ? 6 : 7)}
                  </li>
                )}
              </ul>
            )}
            <p className="text-navy/85 mt-3 line-clamp-6 text-sm leading-relaxed">
              {stripFormatting(v.description) || "La description du poste apparaîtra ici."}
            </p>

            {step === 0 && (
              <>
                <h4 className="text-navy mt-4 border-t border-slate-100 pt-3 font-bold">Informations clés</h4>
                <dl className="mt-2 grid grid-cols-[1fr_1.4fr] gap-y-2 text-sm">
                  <dt className="text-muted">Service</dt>
                  <dd className="text-navy">{department?.name ?? "—"}</dd>
                  <dt className="text-muted">Nombre de postes</dt>
                  <dd className="text-navy">{v.positions || "—"}</dd>
                  <dt className="text-muted">Date limite</dt>
                  <dd className="text-navy">{longDay(v.deadline)}</dd>
                  <dt className="text-muted">Rémunération</dt>
                  <dd className="text-navy">{salary ?? "À discuter"}</dd>
                </dl>
              </>
            )}
            {step === 1 && (
              <>
                <h4 className="text-navy mt-4 border-t border-slate-100 pt-3 font-bold">Critères clés</h4>
                <dl className="mt-2 grid grid-cols-[1fr_1.4fr] gap-y-2 text-sm">
                  <dt className="text-muted">Niveau d&apos;études</dt>
                  <dd className="text-navy">{v.education}</dd>
                  <dt className="text-muted">Langues</dt>
                  <dd className="text-navy">{languages.join(", ") || "—"}</dd>
                  <dt className="text-muted">Disponibilité</dt>
                  <dd className="text-navy">
                    {AVAILABILITY_LABELS[v.availability as keyof typeof AVAILABILITY_LABELS]}
                  </dd>
                  <dt className="text-muted">Mobilité</dt>
                  <dd className="text-navy">{MOBILITY_LABELS[v.mobility as keyof typeof MOBILITY_LABELS]}</dd>
                </dl>
              </>
            )}
          </div>
        </PreviewPanel>

        {step === 2 && (
          <Panel className="p-5">
            <h2 className="text-navy font-bold">Après publication</h2>
            <ul className="mt-4 space-y-4">
              {[
                {
                  icon: BellRing,
                  title: "Suivez les candidatures",
                  text: "Retrouvez-les dans la liste de vos offres",
                },
                {
                  icon: Search,
                  title: "Analysez les talents",
                  text: "Parcourez les profils depuis la section Talents",
                },
                {
                  icon: Lightbulb,
                  title: "Ajustez votre offre",
                  text: "Modifiez-la à tout moment pour attirer plus de profils",
                },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="text-brand flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm">
                    <span className="text-navy block font-semibold">{title}</span>
                    <span className="text-muted block text-xs">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </aside>
    </div>
  );
}
