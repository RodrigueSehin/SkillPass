"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Check,
  GripVertical,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { saveDepartmentAction } from "@/app/business/actions";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import {
  ACCESS_LEVELS,
  ACCESS_LEVEL_LABELS,
  DEPARTMENT_LOOKS,
  memberName,
  type AccessLevel,
  type DepartmentDTO,
  type DepartmentLook,
} from "@/types/business";
import { MemberSearch, type PickableMember } from "./member-picker";
import { DepartmentBadge, LOOKS, MemberAvatar, Panel } from "./ui";
import { InfoBox, PreviewPanel, Stepper, WizardHeader, WizardNav } from "./wizard-parts";

const STEPS = [
  { title: "Informations générales", subtitle: "Nom et description" },
  { title: "Responsable", subtitle: "Définir le responsable" },
  { title: "Équipe et rattachement", subtitle: "Configuration" },
  { title: "Validation", subtitle: "Vérifier et enregistrer" },
];

const field =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2";
const MAX_OBJECTIVES = 10;

/** Picks an icon from the name of the department, so a new one rarely needs the picker. */
export function guessLook(name: string): DepartmentLook {
  const n = name.toLowerCase();
  if (/market|communic|marque/.test(n)) return "megaphone";
  if (/financ|compta|tr[ée]sor/.test(n)) return "coins";
  if (/\bit\b|informat|syst[èe]me|tech|digital|d[ée]velop/.test(n)) return "monitor";
  if (/op[ée]ration|logisti|transport|exploit/.test(n)) return "truck";
  if (/commerc|vente|sales|client/.test(n)) return "chart";
  if (/direction|g[ée]n[ée]ral|strat/.test(n)) return "settings";
  return "users";
}

interface Values {
  name: string;
  description: string;
  look: DepartmentLook;
  lookTouched: boolean;
  parentId: string;
  mainSiteId: string;
  objectives: string[];
  headId: string;
  deputies: { memberId: string; level: "PRINCIPAL" | "DEPUTY" }[];
  replacementId: string;
  members: { memberId: string; role: string }[];
  siteIds: string[];
  accessLevel: AccessLevel;
}

function initialValues(d?: DepartmentDTO): Values {
  return {
    name: d?.name ?? "",
    description: d?.description ?? "",
    look: d?.look ?? "users",
    lookTouched: Boolean(d),
    parentId: d?.parentId ?? "",
    mainSiteId: d?.mainSiteId ?? "",
    objectives: d?.objectives ?? [],
    headId: d?.headId ?? "",
    deputies: d?.deputies ?? [],
    replacementId: d?.replacementId ?? "",
    members: d?.members ?? [],
    siteIds: d?.siteIds ?? [],
    accessLevel: d?.accessLevel ?? "LIMITED",
  };
}

function Stack({ people, max = 3 }: { people: PickableMember[]; max?: number }) {
  if (people.length === 0) return <span className="text-muted">0 membre</span>;
  return (
    <span className="flex items-center">
      {people.slice(0, max).map((p) => (
        <MemberAvatar key={p.id} member={p} className="-ml-2 size-8 text-xs ring-2 ring-white first:ml-0" />
      ))}
      {people.length > max && (
        <span className="text-brand -ml-2 flex size-8 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold ring-2 ring-white">
          +{people.length - max}
        </span>
      )}
    </span>
  );
}

function PersonCard({ person, onClear }: { person: PickableMember; onClear?: () => void }) {
  return (
    <div className="border-border flex items-center gap-3 rounded-xl border bg-white p-3">
      <MemberAvatar member={person} className="size-12" />
      <div className="min-w-0 flex-1">
        <p className="text-navy font-semibold">{memberName(person)}</p>
        <p className="text-muted truncate text-xs">{person.email}</p>
        {person.jobTitle && <p className="text-muted text-xs">{person.jobTitle}</p>}
      </div>
      {onClear && (
        <button
          type="button"
          aria-label={`Retirer ${memberName(person)}`}
          onClick={onClear}
          className="text-muted hover:text-danger p-1"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function DepartmentWizard({
  department,
  members,
  departments,
  sites,
}: {
  /** Set when editing an existing department. */
  department?: DepartmentDTO;
  members: PickableMember[];
  departments: { id: string; name: string }[];
  sites: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Values>(() => initialValues(department));
  const [changingHead, setChangingHead] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const editing = Boolean(department);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));
  const byId = new Map(members.map((m) => [m.id, m]));
  const person = (id: string) => byId.get(id);
  const look = v.lookTouched ? v.look : guessLook(v.name);
  const parent = departments.find((d) => d.id === v.parentId);
  const siteNames = [...new Set([v.mainSiteId, ...v.siteIds])]
    .filter(Boolean)
    .map((id) => sites.find((s) => s.id === id)?.name)
    .filter(Boolean) as string[];
  const memberPeople = v.members.map((m) => person(m.memberId)).filter(Boolean) as PickableMember[];
  const head = v.headId ? person(v.headId) : undefined;
  const replacement = v.replacementId ? person(v.replacementId) : undefined;
  const deputyPeople = v.deputies.map((d) => person(d.memberId)).filter(Boolean) as PickableMember[];

  function next() {
    setError(undefined);
    if (step === 0 && v.name.trim().length < 2)
      return setError("Le nom du département est requis (2 caractères minimum)");
    if (step === 0 && v.objectives.some((o) => !o.trim()))
      return setError("Un objectif est vide : complétez-le ou supprimez-le");
    setStep((s) => Math.min(3, s + 1));
  }

  function save(status: "ACTIVE" | "DRAFT") {
    setError(undefined);
    startTransition(async () => {
      const result = await saveDepartmentAction(department?.id ?? null, {
        name: v.name,
        description: v.description,
        look,
        parentId: v.parentId,
        mainSiteId: v.mainSiteId,
        siteIds: [...new Set([...(v.mainSiteId ? [v.mainSiteId] : []), ...v.siteIds])],
        objectives: v.objectives.map((o) => o.trim()).filter(Boolean),
        status,
        accessLevel: v.accessLevel,
        headId: v.headId,
        deputies: v.deputies,
        replacementId: v.replacementId,
        members: v.members,
      });
      if (result.error) setError(result.error);
      else router.push("/business/organisation?tab=departements");
    });
  }

  const tip =
    step === 0
      ? "Vous pourrez définir le responsable, ajouter les membres et configurer les accès dans les étapes suivantes."
      : step === 1
        ? "Vous pourrez modifier le responsable et les adjoints à tout moment après la création du département."
        : "Vous pourrez modifier les membres, le rattachement et les accès à tout moment après la création du département.";

  return (
    <div className="space-y-6">
      <WizardHeader
        trail={[
          { label: "Organisation", href: "/business/organisation" },
          { label: editing ? "Modifier le département" : "Ajouter un département" },
        ]}
        backHref="/business/organisation?tab=departements"
        title={editing ? "Modifier le département" : "Ajouter un département"}
        description="Créez un nouveau département pour organiser votre structure et faciliter la gestion des talents."
      />
      <Stepper steps={STEPS} current={step} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel className="p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-navy text-xl font-bold">Informations générales</h2>
                <p className="text-muted mt-1 text-sm">
                  Commencez par renseigner les informations de base du département.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-name">
                  Nom du département <span className="text-danger">*</span>
                </Label>
                <input
                  id="dept-name"
                  value={v.name}
                  maxLength={80}
                  onChange={(e) => set("name", e.target.value)}
                  className={field}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-description">Description</Label>
                <div className="relative">
                  <textarea
                    id="dept-description"
                    rows={4}
                    maxLength={500}
                    value={v.description}
                    onChange={(e) => set("description", e.target.value)}
                    className="border-border focus-visible:ring-brand/40 w-full resize-none rounded-xl border bg-white px-4 py-3 pb-7 text-sm outline-none focus-visible:ring-2"
                  />
                  <span className="text-muted absolute right-3 bottom-2 text-xs">
                    {v.description.length}/500
                  </span>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dept-parent">Département parent (optionnel)</Label>
                  <select
                    id="dept-parent"
                    value={v.parentId}
                    onChange={(e) => set("parentId", e.target.value)}
                    className={field}
                  >
                    <option value="">Aucun</option>
                    {departments
                      .filter((d) => d.id !== department?.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-muted text-xs">
                    Sélectionnez le département auquel ce département sera rattaché.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept-site">Localisation principale</Label>
                  <select
                    id="dept-site"
                    value={v.mainSiteId}
                    onChange={(e) => set("mainSiteId", e.target.value)}
                    className={field}
                  >
                    <option value="">Aucune</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-muted text-xs">Localisation principale du département.</p>
                </div>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Apparence</legend>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENT_LOOKS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-label={LOOKS[l].label}
                      aria-pressed={look === l}
                      onClick={() => setV((prev) => ({ ...prev, look: l, lookTouched: true }))}
                      className={cn(
                        "rounded-xl p-1 ring-2",
                        look === l ? "ring-brand" : "ring-transparent hover:ring-slate-200",
                      )}
                    >
                      <DepartmentBadge look={l} className="size-10" />
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <p className="text-sm font-medium">Objectifs principaux (optionnel)</p>
                <p className="text-muted text-xs">Définissez les objectifs clés de ce département.</p>
                <ul className="space-y-2">
                  {v.objectives.map((o, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <GripVertical className="size-4 shrink-0 text-slate-300" aria-hidden />
                      <div className="relative flex-1">
                        <input
                          aria-label={`Objectif ${i + 1}`}
                          value={o}
                          maxLength={100}
                          onChange={(e) =>
                            set(
                              "objectives",
                              v.objectives.map((x, j) => (j === i ? e.target.value : x)),
                            )
                          }
                          className={cn(field, "pr-16")}
                        />
                        <span className="text-muted absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                          {o.length}/100
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={`Supprimer l'objectif ${i + 1}`}
                        onClick={() =>
                          set(
                            "objectives",
                            v.objectives.filter((_, j) => j !== i),
                          )
                        }
                        className="text-danger p-1.5"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                {v.objectives.length < MAX_OBJECTIVES && (
                  <button
                    type="button"
                    onClick={() => set("objectives", [...v.objectives, ""])}
                    className="text-brand flex h-9 items-center gap-2 rounded-lg bg-blue-50 px-3 text-sm font-semibold hover:bg-blue-100"
                  >
                    <Plus className="size-4" aria-hidden /> Ajouter un objectif
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-navy text-xl font-bold">Responsable du département</h2>
                <p className="text-muted mt-1 text-sm">
                  Désignez le responsable qui dirigera ce département.
                </p>
              </div>
              <div className="space-y-3">
                {head ? (
                  <PersonCard person={head} onClear={() => set("headId", "")} />
                ) : (
                  <p className="text-muted rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    Aucun responsable défini.
                  </p>
                )}
                {changingHead || !head ? (
                  <MemberSearch
                    label="Rechercher le responsable"
                    placeholder="Rechercher un collaborateur…"
                    options={members.filter((m) => m.status !== "INVITED")}
                    onPick={(id) => {
                      set("headId", id);
                      setChangingHead(false);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setChangingHead(true)}
                    className="border-brand/40 text-brand flex h-11 w-full items-center gap-2 rounded-xl border bg-blue-50/50 px-4 text-sm font-semibold hover:bg-blue-50"
                  >
                    <UserRound className="size-4" aria-hidden /> Changer de responsable
                  </button>
                )}
                <InfoBox title="Le responsable du département aura automatiquement des droits de gestion sur ce département.">
                  Il pourra gérer les membres, consulter les évaluations et valider les demandes.
                </InfoBox>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-navy font-bold">Responsables adjoints (optionnel)</h3>
                  <p className="text-muted text-sm">
                    Vous pouvez ajouter un ou plusieurs adjoints pour soutenir la gestion du département.
                  </p>
                </div>
                <MemberSearch
                  label="Rechercher un adjoint"
                  placeholder="Rechercher un collaborateur…"
                  options={members.filter((m) => m.status !== "INVITED")}
                  exclude={[v.headId, ...v.deputies.map((d) => d.memberId)]}
                  onPick={(id) =>
                    set("deputies", [
                      ...v.deputies,
                      { memberId: id, level: v.deputies.length === 0 ? "PRINCIPAL" : "DEPUTY" },
                    ])
                  }
                />
                <ul className="divide-y divide-slate-100">
                  {v.deputies.map((d) => {
                    const p = person(d.memberId);
                    if (!p) return null;
                    return (
                      <li key={d.memberId} className="flex items-center gap-3 py-3">
                        <MemberAvatar member={p} className="size-10" />
                        <div className="min-w-0 flex-1">
                          <p className="text-navy text-sm font-semibold">{memberName(p)}</p>
                          <p className="text-muted truncate text-xs">{p.email}</p>
                        </div>
                        <select
                          aria-label={`Niveau de ${memberName(p)}`}
                          value={d.level}
                          onChange={(e) =>
                            set(
                              "deputies",
                              v.deputies.map((x) =>
                                x.memberId === d.memberId
                                  ? { ...x, level: e.target.value as "PRINCIPAL" | "DEPUTY" }
                                  : x,
                              ),
                            )
                          }
                          className="border-border h-10 rounded-xl border bg-white px-3 text-sm"
                        >
                          <option value="PRINCIPAL">Adjoint principal</option>
                          <option value="DEPUTY">Adjoint</option>
                        </select>
                        <button
                          type="button"
                          aria-label={`Retirer ${memberName(p)}`}
                          onClick={() =>
                            set(
                              "deputies",
                              v.deputies.filter((x) => x.memberId !== d.memberId),
                            )
                          }
                          className="text-muted hover:text-danger p-1"
                        >
                          <X className="size-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-navy font-bold">Remplacement (optionnel)</h3>
                  <p className="text-muted text-sm">
                    Définissez une personne qui pourra remplacer le responsable en cas d&apos;absence.
                  </p>
                </div>
                {replacement ? (
                  <PersonCard person={replacement} onClear={() => set("replacementId", "")} />
                ) : (
                  <MemberSearch
                    label="Rechercher un remplaçant"
                    placeholder="Rechercher un collaborateur…"
                    options={members.filter((m) => m.status !== "INVITED")}
                    exclude={[v.headId]}
                    onPick={(id) => set("replacementId", id)}
                  />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-navy text-xl font-bold">Équipe et rattachement</h2>
                <p className="text-muted mt-1 text-sm">
                  Configurez la structure du département et définissez ses relations.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-navy font-bold">Membres initiaux (optionnel)</h3>
                  <p className="text-muted text-sm">Ajoutez des collaborateurs à ce département.</p>
                </div>
                <MemberSearch
                  label="Rechercher un membre"
                  placeholder="Rechercher un collaborateur…"
                  options={members.filter((m) => m.status !== "INVITED")}
                  exclude={v.members.map((m) => m.memberId)}
                  onPick={(id) => set("members", [...v.members, { memberId: id, role: "Membre" }])}
                />
                <ul className="divide-y divide-slate-100">
                  {v.members.map((m) => {
                    const p = person(m.memberId);
                    if (!p) return null;
                    return (
                      <li key={m.memberId} className="flex items-center gap-3 py-3">
                        <MemberAvatar member={p} className="size-10" />
                        <div className="min-w-0 flex-1">
                          <p className="text-navy text-sm font-semibold">{memberName(p)}</p>
                          <p className="text-muted truncate text-xs">{p.email}</p>
                        </div>
                        <select
                          aria-label={`Rôle de ${memberName(p)}`}
                          value={m.role}
                          onChange={(e) =>
                            set(
                              "members",
                              v.members.map((x) =>
                                x.memberId === m.memberId ? { ...x, role: e.target.value } : x,
                              ),
                            )
                          }
                          className="border-border h-10 rounded-xl border bg-white px-3 text-sm"
                        >
                          <option>Membre</option>
                          <option>Contributeur</option>
                          <option>Observateur</option>
                        </select>
                        <button
                          type="button"
                          aria-label={`Retirer ${memberName(p)}`}
                          onClick={() =>
                            set(
                              "members",
                              v.members.filter((x) => x.memberId !== m.memberId),
                            )
                          }
                          className="text-muted hover:text-danger p-1"
                        >
                          <X className="size-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-navy font-bold">Rattachement hiérarchique</h3>
                <p className="text-muted text-sm">
                  Sélectionnez le département parent auquel ce département sera rattaché.
                </p>
                <select
                  aria-label="Département parent"
                  value={v.parentId}
                  onChange={(e) => set("parentId", e.target.value)}
                  className={field}
                >
                  <option value="">Aucun (niveau le plus haut)</option>
                  {departments
                    .filter((d) => d.id !== department?.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
                {parent && (
                  <p className="text-muted text-xs">Ce département sera rattaché à {parent.name}.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-navy font-bold">Sites / Localisations</h3>
                <p className="text-muted text-sm">Définissez les sites où le département est présent.</p>
                <ul className="flex flex-wrap gap-2">
                  {sites.map((s) => {
                    const on = v.siteIds.includes(s.id) || v.mainSiteId === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => {
                            if (v.mainSiteId === s.id) return;
                            set("siteIds", on ? v.siteIds.filter((x) => x !== s.id) : [...v.siteIds, s.id]);
                          }}
                          className={cn(
                            "flex h-10 items-center gap-2 rounded-xl border px-3 text-sm",
                            on
                              ? "border-brand text-brand bg-blue-50 font-medium"
                              : "border-border text-navy hover:bg-slate-50",
                          )}
                        >
                          {on ? (
                            <Check className="size-4" aria-hidden />
                          ) : (
                            <Plus className="size-4" aria-hidden />
                          )}{" "}
                          {s.name}
                        </button>
                      </li>
                    );
                  })}
                  {sites.length === 0 && (
                    <li className="text-muted text-sm">
                      Aucun site : ajoutez-en depuis l&apos;organisation.
                    </li>
                  )}
                </ul>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-navy font-bold">Accès aux données</legend>
                <p className="text-muted text-sm">
                  Définissez les périmètres d&apos;accès aux talents et aux évaluations pour ce département.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {ACCESS_LEVELS.map((level) => (
                    <label
                      key={level}
                      className={cn(
                        "focus-within:ring-brand/40 flex cursor-pointer gap-3 rounded-xl border p-3 focus-within:ring-2",
                        v.accessLevel === level ? "border-brand bg-blue-50/60" : "border-border",
                      )}
                    >
                      <input
                        type="radio"
                        name="access-level"
                        checked={v.accessLevel === level}
                        onChange={() => set("accessLevel", level)}
                        className="accent-brand mt-1 size-4"
                      />
                      <span className="text-sm">
                        <span className="text-navy block font-semibold">
                          {ACCESS_LEVEL_LABELS[level].title}
                        </span>
                        <span className="text-muted block text-xs">
                          {ACCESS_LEVEL_LABELS[level].description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-navy text-xl font-bold">Vérification des informations</h2>
                  <p className="text-muted mt-1 text-sm">
                    Veuillez vérifier que toutes les informations sont correctes avant de créer le
                    département.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="border-brand/40 text-brand flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold hover:bg-blue-50"
                >
                  <Pencil className="size-3.5" aria-hidden /> Modifier les informations
                </button>
              </div>

              {[
                {
                  title: "Informations générales",
                  step: 0,
                  body: (
                    <dl className="grid gap-2 text-sm sm:grid-cols-[160px_1fr]">
                      <dt className="text-muted">Nom du département</dt>
                      <dd className="text-navy">{v.name}</dd>
                      <dt className="text-muted">Description</dt>
                      <dd className="text-navy">{v.description || "—"}</dd>
                      {v.objectives.length > 0 && (
                        <>
                          <dt className="text-muted">Objectifs</dt>
                          <dd className="text-navy">{v.objectives.filter(Boolean).join(" · ")}</dd>
                        </>
                      )}
                    </dl>
                  ),
                },
                {
                  title: "Responsable du département",
                  step: 1,
                  body: head ? (
                    <PersonCard person={head} />
                  ) : (
                    <p className="text-muted text-sm">Non défini</p>
                  ),
                },
                {
                  title: "Équipe et rattachement",
                  step: 2,
                  body: (
                    <dl className="grid items-center gap-2 text-sm sm:grid-cols-[160px_1fr]">
                      <dt className="text-muted">Membres</dt>
                      <dd className="flex items-center gap-3">
                        <span className="text-navy">
                          {memberPeople.length} membre{memberPeople.length > 1 ? "s" : ""}
                        </span>
                        <Stack people={memberPeople} />
                      </dd>
                      <dt className="text-muted">Département parent</dt>
                      <dd className="text-navy">{parent?.name ?? "Aucun"}</dd>
                      <dt className="text-muted">Sites / Localisations</dt>
                      <dd className="flex flex-wrap gap-2">
                        {siteNames.length ? (
                          siteNames.map((n) => (
                            <span
                              key={n}
                              className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium"
                            >
                              {n}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">Aucun</span>
                        )}
                      </dd>
                      <dt className="text-muted">Accès aux données</dt>
                      <dd className="text-brand">{ACCESS_LEVEL_LABELS[v.accessLevel].summary}</dd>
                    </dl>
                  ),
                },
              ].map((section) => (
                <section key={section.title} className="border-border/70 rounded-xl border">
                  <header className="flex items-center justify-between gap-3 p-4">
                    <h3 className="text-navy flex items-center gap-3 font-bold">
                      <span className="flex size-7 items-center justify-center rounded-full bg-green-500 text-white">
                        <Check className="size-4" aria-hidden />
                      </span>
                      {section.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStep(section.step)}
                      className="text-brand flex items-center gap-1.5 text-sm font-semibold hover:underline"
                    >
                      <Pencil className="size-3.5" aria-hidden /> Modifier
                    </button>
                  </header>
                  <div className="border-t border-slate-100 p-4">{section.body}</div>
                </section>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="text-danger mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <WizardNav
            onPrevious={() =>
              step === 0 ? router.push("/business/organisation?tab=departements") : setStep(step - 1)
            }
            onNext={() => (step === 3 ? save("ACTIVE") : next())}
            nextLabel={
              step === 3 ? (editing ? "Enregistrer le département" : "Créer le département") : "Suivant"
            }
            nextIcon={step === 3 ? <Check className="size-4" aria-hidden /> : undefined}
            pending={pending}
            extra={
              step === 3 && !editing ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => save("DRAFT")}
                  className="border-border text-navy flex h-11 items-center rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                >
                  Enregistrer en brouillon
                </button>
              ) : undefined
            }
          />
        </Panel>

        <aside className="space-y-5">
          <PreviewPanel title="Aperçu du département">
            <div className="flex items-start gap-4">
              <DepartmentBadge look={look} className="size-16 rounded-2xl [&>svg]:size-8" />
              <div className="min-w-0">
                <p className="text-navy text-xl font-bold">{v.name || "Nouveau département"}</p>
                <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {editing && department?.status === "ACTIVE" ? "Actif" : "Brouillon"}
                </span>
              </div>
            </div>
            <p className="text-muted mt-3 text-sm leading-relaxed">
              {v.description || "La description du département apparaîtra ici."}
            </p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Briefcase className="size-5 shrink-0 text-slate-500" aria-hidden />
                <dt className="text-navy w-32 shrink-0">Rattaché à</dt>
                <dd className="text-brand">{parent?.name ?? "—"}</dd>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="size-5 shrink-0 text-slate-500" aria-hidden />
                <dt className="text-navy w-32 shrink-0">Localisation</dt>
                <dd className="text-brand">{siteNames.join(", ") || "—"}</dd>
              </div>
              <div className="flex items-center gap-3">
                <UserRound className="size-5 shrink-0 text-slate-500" aria-hidden />
                <dt className="text-navy w-32 shrink-0">Responsable</dt>
                <dd>
                  {head ? (
                    <span className="flex items-center gap-2">
                      <MemberAvatar member={head} className="size-8 text-xs" />
                      <span className="text-navy font-semibold">{memberName(head)}</span>
                    </span>
                  ) : (
                    <span className="text-muted">Non défini</span>
                  )}
                </dd>
              </div>
              {deputyPeople.length > 0 && (
                <div className="flex items-center gap-3">
                  <UsersRound className="size-5 shrink-0 text-slate-500" aria-hidden />
                  <dt className="text-navy w-32 shrink-0">Responsables adjoints</dt>
                  <dd>
                    <Stack people={deputyPeople} />
                  </dd>
                </div>
              )}
              {replacement && (
                <div className="flex items-center gap-3">
                  <UserRound className="size-5 shrink-0 text-slate-500" aria-hidden />
                  <dt className="text-navy w-32 shrink-0">Remplacement</dt>
                  <dd className="text-navy font-semibold">{memberName(replacement)}</dd>
                </div>
              )}
              <div className="flex items-center gap-3">
                <UsersRound className="size-5 shrink-0 text-slate-500" aria-hidden />
                <dt className="text-navy w-32 shrink-0">Membres</dt>
                <dd>
                  <Stack people={memberPeople} />
                </dd>
              </div>
            </dl>
          </PreviewPanel>
          {step === 3 ? (
            <InfoBox tone="success" title="Tout est prêt !">
              Le département sera créé avec les informations ci-dessus. Vous pourrez le modifier à tout moment
              depuis les paramètres de votre organisation.
            </InfoBox>
          ) : (
            <InfoBox title="Bon à savoir">{tip}</InfoBox>
          )}
        </aside>
      </div>
    </div>
  );
}
