"use client";

import type { PlanCode } from "@/types/business";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Check,
  Copy,
  Lightbulb,
  Mail,
  Pencil,
  Phone,
  Send,
  Shield,
  UsersRound,
  X,
} from "lucide-react";
import { inviteMemberAction } from "@/app/business/actions";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { keyPermissionGroups, ROLE_PRESETS, ROLE_SUMMARIES } from "@/lib/business/permissions";
import { cn } from "@/lib/utils/cn";
import { ORG_ROLE_DESCRIPTIONS, ORG_ROLE_LABELS, type DepartmentLook, type OrgRole } from "@/types/business";
import { PermissionsEditor, ROLE_ICONS } from "./permissions-editor";
import { DepartmentBadge, MemberAvatar, Panel } from "./ui";
import { InfoBox, PreviewPanel, Stepper, WizardHeader, WizardNav } from "./wizard-parts";

const STEPS = [
  { title: "Informations", subtitle: "Identité et contact" },
  { title: "Rôle et permissions", subtitle: "Définir les accès" },
  { title: "Équipe", subtitle: "Affecter à une équipe" },
  { title: "Invitation", subtitle: "Vérifier et envoyer" },
];

const field =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2";
const JOB_TITLES = [
  "Chargé(e) RH",
  "Responsable RH",
  "Chargé(e) de recrutement",
  "Manager",
  "Directeur / Directrice",
  "Évaluateur / Évaluatrice",
  "Analyste",
  "Assistant(e)",
];
const MAX_MESSAGE = 500;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface TeamOption {
  id: string;
  name: string;
  look: DepartmentLook;
  members: number;
}
export interface ManagerOption {
  id: string;
  name: string;
}

const defaultMessage = (first: string) =>
  `Bonjour ${first || "…"},\n\nNous sommes ravis de vous inviter à rejoindre SkillPass. Vous pourrez participer aux évaluations des talents, consulter les profils et collaborer avec l'équipe.`;

export function MemberWizard({
  organizationName,
  teams,
  managers,
  plan,
}: {
  plan: PlanCode;
  organizationName: string;
  teams: TeamOption[];
  managers: ManagerOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [v, setV] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dialCode: "+225",
    phone: "",
    jobTitle: "",
    message: "",
    messageTouched: false,
    role: "VIEWER" as OrgRole,
    permissions: ROLE_PRESETS.VIEWER,
    primaryTeamId: "",
    secondaryTeamIds: [] as string[],
    managerId: "",
  });
  const [teamQuery, setTeamQuery] = useState("");
  const [error, setError] = useState<string>();
  const [link, setLink] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const fullName = `${v.firstName} ${v.lastName}`.trim();
  const message = v.messageTouched ? v.message : defaultMessage(v.firstName);
  const phone = v.phone.trim() ? `${v.dialCode} ${v.phone.trim()}` : "";
  const team = (id: string) => teams.find((t) => t.id === id);
  const primary = v.primaryTeamId ? team(v.primaryTeamId) : undefined;
  const secondary = v.secondaryTeamIds.map(team).filter(Boolean) as TeamOption[];
  const groups = keyPermissionGroups(v.permissions);
  const RoleIcon = ROLE_ICONS[v.role].icon;

  function validate(forStep: number) {
    if (forStep === 0) {
      if (!v.firstName.trim()) return "Le prénom est requis";
      if (!v.lastName.trim()) return "Le nom est requis";
      if (!EMAIL.test(v.email.trim())) return "Saisissez une adresse e-mail valide";
      if (v.jobTitle.trim().length < 2) return "La fonction est requise";
      if (message.length > MAX_MESSAGE) return `Le message est trop long (${MAX_MESSAGE} caractères maximum)`;
    }
    if (forStep === 2 && !v.primaryTeamId) return "Choisissez l'équipe principale du membre";
    return undefined;
  }

  function next() {
    const problem = validate(step);
    setError(problem);
    if (!problem) setStep((s) => Math.min(3, s + 1));
  }

  function send() {
    const problem = validate(0) ?? validate(2);
    if (problem) return setError(problem);
    setError(undefined);
    startTransition(async () => {
      const result = await inviteMemberAction({
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone,
        jobTitle: v.jobTitle,
        invitationMessage: message,
        role: v.role,
        permissions: v.permissions,
        primaryTeamId: v.primaryTeamId,
        secondaryTeamIds: v.secondaryTeamIds,
        managerId: v.managerId,
      });
      if (result.error) setError(result.error);
      else setLink(result.link);
    });
  }

  const person = { firstName: v.firstName || "?", lastName: v.lastName };

  if (link) {
    const text = `${message}\n\n${link}`;
    return (
      <div className="space-y-6">
        <WizardHeader
          trail={[{ label: "Équipes", href: "/business/equipes" }, { label: "Ajouter un membre" }]}
          backHref="/business/equipes"
          title="Invitation créée"
          description={`${fullName} peut maintenant rejoindre ${organizationName}.`}
        />
        <Panel className="max-w-3xl space-y-5 p-6">
          <p className="text-muted text-sm">
            SkillPass n&apos;envoie pas encore d&apos;e-mail : copiez le message ci-dessous et envoyez-le à{" "}
            <strong className="text-navy">{v.email}</strong>. Le lien est personnel, valable 7 jours et ne
            peut être utilisé qu&apos;une fois.
          </p>
          <div className="space-y-2">
            <Label htmlFor="invite-link">Lien d&apos;invitation</Label>
            <input
              id="invite-link"
              readOnly
              value={link}
              aria-label="Lien d'invitation"
              onFocus={(e) => e.currentTarget.select()}
              className={cn(field, "font-mono text-xs")}
            />
          </div>
          <pre className="border-border max-h-64 overflow-auto rounded-xl border bg-slate-50 p-4 text-sm whitespace-pre-wrap">
            {text}
          </pre>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  window.prompt("Copiez ce message :", text);
                }
              }}
              className="bg-brand flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Message copié" : "Copier le message"}
            </button>
            <Link href="/business/equipes" className={buttonVariants({ variant: "outline" })}>
              Retour aux équipes
            </Link>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardHeader
        trail={[{ label: "Équipes", href: "/business/equipes" }, { label: "Ajouter un membre" }]}
        backHref="/business/equipes"
        title="Ajouter un membre"
        description="Invitez un collaborateur à rejoindre votre organisation sur SkillPass."
      />
      <Stepper steps={STEPS} current={step} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel className="p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-navy text-xl font-bold">Informations du membre</h2>
                <p className="text-muted mt-1 text-sm">
                  Renseignez les informations de base du collaborateur.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="m-first">
                    Prénom <span className="text-danger">*</span>
                  </Label>
                  <input
                    id="m-first"
                    value={v.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className={field}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-last">
                    Nom <span className="text-danger">*</span>
                  </Label>
                  <input
                    id="m-last"
                    value={v.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className={field}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-email">
                    Adresse e-mail professionnelle <span className="text-danger">*</span>
                  </Label>
                  <input
                    id="m-email"
                    type="email"
                    value={v.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="prenom.nom@entreprise.com"
                    className={field}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-phone">Téléphone (optionnel)</Label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Indicatif"
                      value={v.dialCode}
                      onChange={(e) => set("dialCode", e.target.value)}
                      className={cn(field, "w-28")}
                    >
                      {["+225", "+221", "+223", "+226", "+228", "+229", "+237", "+33", "+1"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      id="m-phone"
                      type="tel"
                      value={v.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="07 58 12 34 56"
                      className={field}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-job">
                    Fonction <span className="text-danger">*</span>
                  </Label>
                  <input
                    id="m-job"
                    list="job-titles"
                    value={v.jobTitle}
                    onChange={(e) => set("jobTitle", e.target.value)}
                    placeholder="Ex : Chargée RH"
                    className={field}
                  />
                  <datalist id="job-titles">
                    {JOB_TITLES.map((j) => (
                      <option key={j} value={j} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-team">Service / Département</Label>
                  <select
                    id="m-team"
                    value={v.primaryTeamId}
                    onChange={(e) => set("primaryTeamId", e.target.value)}
                    className={field}
                  >
                    <option value="">Sélectionner</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-message">
                  Message d&apos;invitation <span className="text-muted font-normal">(optionnel)</span>
                </Label>
                <p className="text-muted text-xs">Personnalisez le message qui sera envoyé au membre.</p>
                <textarea
                  id="m-message"
                  rows={5}
                  value={message}
                  onChange={(e) =>
                    setV((prev) => ({ ...prev, message: e.target.value, messageTouched: true }))
                  }
                  className="border-border focus-visible:ring-brand/40 w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2"
                />
                <p
                  className={cn(
                    "text-right text-xs",
                    message.length > MAX_MESSAGE ? "text-danger" : "text-muted",
                  )}
                >
                  {message.length}/{MAX_MESSAGE}
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-navy text-xl font-bold">Rôle et permissions</h2>
                <p className="text-muted mt-1 text-sm">
                  Définissez le rôle du membre et les accès qu&apos;il aura sur la plateforme.
                </p>
              </div>
              <PermissionsEditor
                plan={plan}
                role={v.role}
                permissions={v.permissions}
                onChange={(role, permissions) => setV((prev) => ({ ...prev, role, permissions }))}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-navy text-xl font-bold">Affectation à une équipe</h2>
                <p className="text-muted mt-1 text-sm">
                  Choisissez l&apos;équipe principale du membre et, si nécessaire, d&apos;autres équipes
                  secondaires.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-navy font-bold">
                  Équipe principale <span className="text-danger">*</span>
                </h3>
                <p className="text-muted text-xs">Cette équipe sera l&apos;équipe principale du membre.</p>
                <select
                  aria-label="Équipe principale"
                  value={v.primaryTeamId}
                  onChange={(e) => set("primaryTeamId", e.target.value)}
                  className={field}
                >
                  <option value="">Sélectionner une équipe</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <InfoBox title="Le membre héritera des accès et des évaluations associés à cette équipe.">
                  {null}
                </InfoBox>
              </div>

              <div className="space-y-2">
                <h3 className="text-navy font-bold">Équipes secondaires (optionnel)</h3>
                <p className="text-muted text-xs">
                  Vous pouvez ajouter ce membre à d&apos;autres équipes pour lui donner accès à des
                  évaluations et des talents spécifiques.
                </p>
                <input
                  type="search"
                  aria-label="Rechercher une équipe"
                  value={teamQuery}
                  onChange={(e) => setTeamQuery(e.target.value)}
                  placeholder="Rechercher une équipe…"
                  className={field}
                />
                <ul className="divide-y divide-slate-100">
                  {teams
                    .filter(
                      (t) =>
                        t.id !== v.primaryTeamId &&
                        t.name.toLowerCase().includes(teamQuery.trim().toLowerCase()),
                    )
                    .map((t) => (
                      <li key={t.id}>
                        <label className="flex cursor-pointer items-center gap-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={v.secondaryTeamIds.includes(t.id)}
                            onChange={(e) =>
                              set(
                                "secondaryTeamIds",
                                e.target.checked
                                  ? [...v.secondaryTeamIds, t.id]
                                  : v.secondaryTeamIds.filter((x) => x !== t.id),
                              )
                            }
                            className="accent-brand size-4 rounded"
                          />
                          <DepartmentBadge look={t.look} className="size-8" />
                          <span className="text-navy flex-1 text-sm font-medium">{t.name}</span>
                          <span className="text-muted text-xs">
                            {t.members} membre{t.members > 1 ? "s" : ""}
                          </span>
                        </label>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-navy font-bold">Responsable (optionnel)</h3>
                <p className="text-muted text-xs">Définissez un responsable direct pour ce membre.</p>
                <select
                  aria-label="Responsable"
                  value={v.managerId}
                  onChange={(e) => set("managerId", e.target.value)}
                  className={field}
                >
                  <option value="">Sélectionner un responsable…</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-navy text-xl font-bold">Vérification et envoi</h2>
                <p className="text-muted mt-1 text-sm">
                  Vérifiez les informations avant de créer l&apos;invitation.
                </p>
              </div>
              {[
                {
                  title: "Résumé du membre",
                  step: 0,
                  body: (
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-3">
                        <MemberAvatar member={person} className="size-14 text-lg" />
                        <div>
                          <p className="text-navy font-bold">{fullName}</p>
                          <p className="text-muted text-sm">{v.email}</p>
                          {phone && <p className="text-muted text-sm">{phone}</p>}
                        </div>
                      </div>
                      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                        <div>
                          <dt className="text-muted text-xs">Fonction</dt>
                          <dd className="text-navy font-semibold">{v.jobTitle}</dd>
                        </div>
                        <div>
                          <dt className="text-muted text-xs">Département</dt>
                          <dd className="text-navy font-semibold">{primary?.name ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted text-xs">Rôle</dt>
                          <dd className="text-navy font-semibold">{ORG_ROLE_LABELS[v.role]}</dd>
                        </div>
                      </dl>
                    </div>
                  ),
                },
                {
                  title: "Affectation des équipes",
                  step: 2,
                  body: (
                    <ul className="flex flex-wrap gap-2">
                      {primary && (
                        <li className="bg-brand/10 text-brand flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium">
                          {primary.name}{" "}
                          <span className="bg-brand rounded px-1.5 py-0.5 text-[10px] text-white">
                            Principale
                          </span>
                        </li>
                      )}
                      {secondary.map((t) => (
                        <li key={t.id} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium">
                          {t.name}
                        </li>
                      ))}
                    </ul>
                  ),
                },
                {
                  title: "Permissions principales",
                  step: 1,
                  body: (
                    <ul className="flex flex-wrap gap-2">
                      {groups.slice(0, 4).map((g) => (
                        <li
                          key={g.key}
                          className="text-navy rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium"
                        >
                          {g.title}
                        </li>
                      ))}
                      {groups.length > 4 && (
                        <li className="text-muted rounded-lg bg-slate-100 px-3 py-1.5 text-sm">
                          +{groups.length - 4} autres
                        </li>
                      )}
                      {groups.length === 0 && <li className="text-muted text-sm">Aucune permission</li>}
                    </ul>
                  ),
                },
              ].map((section) => (
                <section key={section.title} className="border-border/70 rounded-xl border">
                  <header className="flex items-center justify-between gap-3 px-4 pt-4">
                    <h3 className="text-navy font-bold">{section.title}</h3>
                    <button
                      type="button"
                      onClick={() => setStep(section.step)}
                      className="text-brand flex items-center gap-1.5 text-sm font-semibold hover:underline"
                    >
                      <Pencil className="size-3.5" aria-hidden /> Modifier
                    </button>
                  </header>
                  <div className="p-4">{section.body}</div>
                </section>
              ))}

              <section className="border-border/70 rounded-xl border">
                <header className="flex items-center justify-between gap-3 px-4 pt-4">
                  <h3 className="text-navy font-bold">Aperçu de l&apos;e-mail d&apos;invitation</h3>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-brand flex items-center gap-1.5 text-sm font-semibold hover:underline"
                  >
                    <Pencil className="size-3.5" aria-hidden /> Modifier
                  </button>
                </header>
                <div className="m-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-sm">
                  <dl className="space-y-0.5 border-b border-slate-200 p-4 text-xs">
                    <div className="flex gap-2">
                      <dt className="text-muted w-10">De :</dt>
                      <dd>no-reply@skillpass.com</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted w-10">À :</dt>
                      <dd>{v.email}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted w-10">Objet :</dt>
                      <dd>Invitation à rejoindre {organizationName} sur SkillPass</dd>
                    </div>
                  </dl>
                  <div className="space-y-3 bg-white p-4">
                    <p className="whitespace-pre-line">{message}</p>
                    <p>
                      Vous êtes invité(e) à rejoindre l&apos;organisation <strong>{organizationName}</strong>{" "}
                      sur SkillPass.
                    </p>
                    <span className="bg-brand inline-block rounded-lg px-4 py-2 text-xs font-semibold text-white">
                      Rejoindre SkillPass
                    </span>
                    <p className="text-muted text-xs">Cette invitation est valable pendant 7 jours.</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {error && (
            <p role="alert" className="text-danger mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <WizardNav
            onPrevious={() => (step === 0 ? router.push("/business/equipes") : setStep(step - 1))}
            previousLabel={step === 0 ? "Annuler" : "Précédent"}
            onNext={() => (step === 3 ? send() : next())}
            nextLabel={step === 3 ? "Créer l'invitation" : "Suivant"}
            nextIcon={step === 3 ? <Send className="size-4" aria-hidden /> : undefined}
            pending={pending}
          />
        </Panel>

        <aside className="space-y-5">
          <PreviewPanel title={step === 0 ? "Aperçu rapide" : "Aperçu du membre"}>
            <div className="flex items-center gap-4">
              <MemberAvatar member={person} className="size-16 text-xl" />
              <div className="min-w-0">
                <p className="text-navy text-lg font-bold">{fullName || "Nouveau membre"}</p>
                <p className="text-muted truncate text-sm">{v.email || "adresse e-mail"}</p>
                {phone && (
                  <p className="text-muted flex items-center gap-1.5 text-sm">
                    <Phone className="size-3.5" aria-hidden /> {phone}
                  </p>
                )}
              </div>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {v.jobTitle && (
                <li className="text-navy flex items-center gap-3">
                  <Briefcase className="size-5 text-slate-500" aria-hidden /> {v.jobTitle}
                </li>
              )}
              {primary && (
                <li className="text-brand flex items-center gap-3">
                  <UsersRound className="size-5 text-slate-500" aria-hidden /> {primary.name}
                </li>
              )}
              {step >= 1 && (
                <li className="text-navy flex items-center gap-3">
                  <Shield className="size-5 text-violet-600" aria-hidden /> {ORG_ROLE_LABELS[v.role]}
                </li>
              )}
            </ul>
          </PreviewPanel>

          {step === 0 && (
            <>
              <InfoBox title="Que se passe-t-il ensuite ?">
                <ol className="space-y-2">
                  {[
                    "Vous définissez le rôle et les permissions",
                    "Vous l'affectez à une équipe (optionnel)",
                    "Une invitation par e-mail sera envoyée",
                    "Le membre pourra se connecter et commencer à utiliser SkillPass",
                  ].map((t, i) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="bg-brand/10 text-brand flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                        {i + 1}
                      </span>
                      {t}
                    </li>
                  ))}
                </ol>
              </InfoBox>
              <Panel className="p-5">
                <h2 className="text-navy flex items-center gap-2 font-bold">
                  <Lightbulb className="size-5 text-amber-500" aria-hidden /> Conseils
                </h2>
                <ul className="mt-3 space-y-2">
                  {[
                    "Utilisez une adresse e-mail professionnelle",
                    "Choisissez une fonction claire",
                    "Ajoutez un message d'invitation personnalisé",
                    "Vous pourrez modifier ces informations plus tard",
                  ].map((t) => (
                    <li key={t} className="text-navy flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden /> {t}
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}

          {step === 1 && (
            <>
              <PreviewPanel title="Résumé du rôle sélectionné">
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "flex size-14 shrink-0 items-center justify-center rounded-xl",
                      ROLE_ICONS[v.role].tone,
                    )}
                  >
                    <RoleIcon className="size-7" aria-hidden />
                  </span>
                  <div>
                    <p className="text-navy text-lg font-bold">{ORG_ROLE_LABELS[v.role]}</p>
                    <p className="text-muted text-sm">{ORG_ROLE_DESCRIPTIONS[v.role]}.</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-blue-50/60 p-4">
                  <p className="text-navy text-sm font-semibold">Ce rôle inclut généralement :</p>
                  <ul className="mt-2 space-y-2">
                    {ROLE_SUMMARIES[v.role].map((t) => (
                      <li key={t} className="text-navy flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </PreviewPanel>
              <InfoBox tone="tip" title="Bon à savoir">
                Vous pouvez ajuster les permissions ci-contre pour personnaliser les accès de ce membre, même
                avec un rôle prédéfini.
              </InfoBox>
            </>
          )}

          {step === 2 && (
            <>
              <PreviewPanel title="Affectation des équipes">
                {primary ? (
                  <div className="border-border flex items-center gap-3 rounded-xl border p-3">
                    <DepartmentBadge look={primary.look} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <p className="text-navy font-semibold">{primary.name}</p>
                      <p className="text-muted text-xs">Équipe principale du membre</p>
                    </div>
                    <span className="text-brand rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold">
                      Principale
                    </span>
                  </div>
                ) : (
                  <p className="text-muted text-sm">Aucune équipe principale choisie.</p>
                )}
                {secondary.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-navy text-sm font-bold">Équipes secondaires ({secondary.length})</p>
                    {secondary.map((t) => (
                      <div key={t.id} className="border-border flex items-center gap-3 rounded-xl border p-3">
                        <DepartmentBadge look={t.look} className="size-9" />
                        <span className="text-navy flex-1 text-sm font-medium">{t.name}</span>
                        <button
                          type="button"
                          aria-label={`Retirer ${t.name}`}
                          onClick={() =>
                            set(
                              "secondaryTeamIds",
                              v.secondaryTeamIds.filter((x) => x !== t.id),
                            )
                          }
                          className="text-muted hover:text-danger p-1"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </PreviewPanel>
              <InfoBox title="Pourquoi affecter à plusieurs équipes ?">
                Un membre peut faire partie de plusieurs équipes, par exemple pour participer à des
                évaluations transverses ou consulter les talents de différents départements.
              </InfoBox>
              <InfoBox tone="tip" title="Bonnes pratiques">
                <ul className="space-y-1.5">
                  {[
                    "Assignez le membre à une équipe principale claire",
                    "Ajoutez des équipes secondaires si nécessaire",
                    "Définissez un responsable pour faciliter le suivi",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-green-600" aria-hidden /> {t}
                    </li>
                  ))}
                </ul>
              </InfoBox>
            </>
          )}

          {step === 3 && (
            <>
              <PreviewPanel title="Affectation des équipes">
                <ul className="space-y-2">
                  {primary && (
                    <li className="flex items-center gap-3">
                      <DepartmentBadge look={primary.look} className="size-9" />
                      <span className="text-navy flex-1 text-sm font-medium">{primary.name}</span>
                      <span className="text-brand rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold">
                        Principale
                      </span>
                    </li>
                  )}
                  {secondary.map((t) => (
                    <li key={t.id} className="flex items-center gap-3">
                      <DepartmentBadge look={t.look} className="size-9" />
                      <span className="text-navy text-sm font-medium">{t.name}</span>
                    </li>
                  ))}
                </ul>
                <h3 className="text-navy mt-5 mb-2 text-sm font-bold">Permissions clés</h3>
                <ul className="space-y-2 text-sm">
                  {groups.slice(0, 4).map((g) => (
                    <li key={g.key} className="text-navy flex items-center gap-2.5">
                      <Check className="size-4 text-green-600" aria-hidden /> {g.title}
                    </li>
                  ))}
                </ul>
              </PreviewPanel>
              <InfoBox tone="tip" title="Après l'envoi">
                <Mail className="mb-1 size-4" aria-hidden />
                Le membre recevra un message avec un lien pour créer son compte. Il aura accès à la plateforme
                selon les permissions définies.
              </InfoBox>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
