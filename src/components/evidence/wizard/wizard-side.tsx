import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  FolderKanban,
  Lightbulb,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { formatPeriod } from "@/lib/evidence-view";
import { cn } from "@/lib/utils/cn";
import { EVIDENCE_TYPE_LABELS } from "@/types/evidence";
import { TYPE_GRADIENTS, TYPE_ICONS, Chip } from "../evidence-bits";
import type { WizardState } from "./wizard-types";
import { sideCardClass } from "./wizard-ui";

const TIPS_BY_STEP = [
  [
    "Soyez précis et concret dans la description de votre projet.",
    "Mettez en avant votre rôle et les résultats obtenus.",
    "Ajoutez des preuves visuelles (captures, vidéos, documents).",
    "Mentionnez les technologies et compétences utilisées.",
    "Une preuve bien détaillée augmente votre crédibilité.",
  ],
  [
    "Sélectionnez les technologies réellement utilisées dans votre projet.",
    "Ajoutez uniquement les compétences que vous avez effectivement mises en œuvre.",
    "Ces informations permettront aux recruteurs de mieux comprendre votre expertise.",
    "Vous pourrez modifier ces éléments plus tard si nécessaire.",
  ],
];

export function Tips({ step }: { step: 0 | 1 }) {
  return (
    <section aria-labelledby="tips-title" className={sideCardClass}>
      <h2 id="tips-title" className="text-navy flex items-center gap-2 font-bold">
        <Lightbulb className="text-brand size-5" aria-hidden /> Conseils
      </h2>
      <ul className="mt-4 space-y-2.5">
        {TIPS_BY_STEP[step].map((t) => (
          <li key={t} className="text-navy flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="text-brand mt-0.5 size-4 shrink-0" aria-hidden /> {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Static illustration of a well-filled evidence (no figures: nothing here is real data). */
export function Example() {
  return (
    <section aria-labelledby="example-title" className={sideCardClass}>
      <h2 id="example-title" className="text-navy font-bold">
        Exemple de preuve
      </h2>
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-brand inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold">
            <FolderKanban className="size-3.5" aria-hidden /> Projet
          </span>
          <span className="text-success inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold">
            <CheckCircle2 className="size-3" aria-hidden /> Publiée
          </span>
        </div>
        <div
          aria-hidden
          className="mt-3 flex h-28 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white/90"
        >
          <FolderKanban className="size-10" />
        </div>
        <p className="text-navy mt-3 font-bold">Application de gestion des cotations</p>
        <p className="text-muted mt-1 text-xs">
          Application de gestion des cotations pour le transport et la logistique. Permet de gérer les demandes,
          générer des devis et suivre les dossiers clients.
        </p>
        <dl className="mt-3 space-y-1.5 text-xs">
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <dt className="text-muted">Rôle</dt>
            <dd className="text-navy">UI/UX + Power Platform Developer</dd>
          </div>
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <dt className="text-muted">Période</dt>
            <dd className="text-navy">Jan. 2024 – Juin 2024</dd>
          </div>
        </dl>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {["Power Apps", "Dataverse", "Power Automate"].map((t) => (
            <li key={t}>
              <Chip>{t}</Chip>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Cover({ values, className }: { values: WizardState; className?: string }) {
  const image = values.files.find((f) => f.preview);
  const Icon = TYPE_ICONS[values.type];
  return (
    <div className={cn("overflow-hidden bg-gradient-to-br", TYPE_GRADIENTS[values.type], className)}>
      {image?.preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
        <img src={image.preview} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/90">
          <Icon className="size-10" aria-hidden />
        </div>
      )}
    </div>
  );
}

function Rows({ values, labels }: { values: WizardState; labels: { org: string; type?: boolean } }) {
  const period = formatPeriod(values);
  return (
    <dl className="space-y-2 text-sm">
      {values.organization && (
        <div className="grid grid-cols-[110px_1fr] items-start gap-2">
          <dt className="text-muted flex items-center gap-2">
            <Building2 className="size-4" aria-hidden /> {labels.org}
          </dt>
          <dd className="text-navy break-words">{values.organization}</dd>
        </div>
      )}
      {period && (
        <div className="grid grid-cols-[110px_1fr] items-start gap-2">
          <dt className="text-muted flex items-center gap-2">
            <CalendarDays className="size-4" aria-hidden /> Période
          </dt>
          <dd className="text-navy">{period}</dd>
        </div>
      )}
      {values.role && (
        <div className="grid grid-cols-[110px_1fr] items-start gap-2">
          <dt className="text-muted flex items-center gap-2">
            <UserRound className="size-4" aria-hidden /> Rôle
          </dt>
          <dd className="text-navy break-words">{values.role}</dd>
        </div>
      )}
    </dl>
  );
}

interface RecapProps {
  step: number;
  values: WizardState;
  skillNames: string[];
  onEdit?: () => void;
}

/** Summary shown next to steps 2 and 3. */
export function Recap({ step, values, skillNames, onEdit }: RecapProps) {
  const Icon = TYPE_ICONS[values.type];
  const withCover = step === 2;
  return (
    <section aria-labelledby="recap-title" className={cn(sideCardClass, "space-y-4")}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="recap-title" className="text-navy text-lg font-extrabold">
          Récapitulatif
        </h2>
        {step === 1 ? (
          <span className="text-brand rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold">Étape 2 sur 4</span>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="text-brand border-brand/40 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-blue-50"
          >
            <Pencil className="size-3.5" aria-hidden /> Modifier
          </button>
        )}
      </div>

      {withCover && <Cover values={values} className="h-32 rounded-xl" />}

      <div className="flex items-start gap-3">
        {!withCover && (
          <span className="text-brand flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <Icon className="size-6" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-navy font-bold break-words">{values.title || "Titre de la preuve"}</p>
          {!withCover && (
            <p className="text-muted line-clamp-3 text-xs">{values.description || "Votre description apparaîtra ici."}</p>
          )}
        </div>
      </div>

      <Rows values={values} labels={{ org: "Organisation" }} />

      {withCover && (
        <>
          <div className="border-border/70 grid grid-cols-[110px_1fr] gap-2 border-t pt-3 text-sm">
            <span className="text-navy font-semibold">Technologies</span>
            <ul className="flex flex-wrap gap-1.5">
              {values.technologies.length === 0 && <li className="text-muted text-xs">Aucune</li>}
              {values.technologies.map((t) => (
                <li key={t}>
                  <Chip>{t}</Chip>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-border/70 border-t pt-3">
            <p className="text-navy text-sm font-semibold">Type de preuve</p>
            <span className="text-navy mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium">
              <Icon className="text-brand size-4" aria-hidden /> {EVIDENCE_TYPE_LABELS[values.type]}
            </span>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <div>
            <h3 className="text-navy text-sm font-bold">Technologies sélectionnées ({values.technologies.length})</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {values.technologies.length === 0 && <li className="text-muted text-xs">Aucune pour l&apos;instant.</li>}
              {values.technologies.map((t) => (
                <li key={t}>
                  <Chip>{t}</Chip>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-navy text-sm font-bold">Compétences sélectionnées ({skillNames.length})</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {skillNames.length === 0 && <li className="text-muted text-xs">Aucune pour l&apos;instant.</li>}
              {skillNames.map((s) => (
                <li key={s}>
                  <Chip className="bg-blue-100/60">{s}</Chip>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

export function ProofSideNotes() {
  return (
    <>
      <section className="space-y-2 rounded-2xl bg-blue-50 p-5">
        <h3 className="text-navy flex items-center gap-2 font-bold">
          <Lightbulb className="text-brand size-5" aria-hidden /> Conseil
        </h3>
        <p className="text-navy text-sm">
          Ajoutez des captures d&apos;écran, des liens vers vos réalisations ou des documents qui prouvent
          concrètement votre travail.
        </p>
      </section>
      <section className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
        <ShieldCheck className="text-success size-8 shrink-0" aria-hidden />
        <p className="text-navy text-sm">
          La vérification de vos preuves par notre équipe arrive bientôt. En attendant, votre preuve est publiée
          comme « non vérifiée ».
        </p>
      </section>
    </>
  );
}

/** Live preview shown next to the last step. */
export function PublishPreview({
  values,
  skillNames,
  onEdit,
}: {
  values: WizardState;
  skillNames: string[];
  onEdit: () => void;
}) {
  const files = values.files;
  return (
    <section aria-labelledby="preview-title" className={cn(sideCardClass, "space-y-4")}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="preview-title" className="text-navy text-lg font-extrabold">
          Aperçu de la preuve
        </h2>
        <button
          type="button"
          onClick={onEdit}
          className="text-brand border-brand/40 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-blue-50"
        >
          <Pencil className="size-3.5" aria-hidden /> Modifier
        </button>
      </div>
      <Cover values={values} className="h-40 rounded-xl" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-navy font-bold break-words">{values.title || "Titre de la preuve"}</p>
        <span className="text-success inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold">
          <CheckCircle2 className="size-3" aria-hidden /> Prête à publier
        </span>
      </div>
      <p className="text-muted text-xs">{values.description}</p>
      <div className="grid grid-cols-[110px_1fr] gap-2 text-sm">
        <span className="text-muted">Type</span>
        <span className="text-navy">{EVIDENCE_TYPE_LABELS[values.type]}</span>
      </div>
      <Rows values={values} labels={{ org: "Organisation" }} />
      <div>
        <h3 className="text-navy text-sm font-bold">Technologies</h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {values.technologies.map((t) => (
            <li key={t}>
              <Chip>{t}</Chip>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-navy text-sm font-bold">Compétences ({skillNames.length})</h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {skillNames.map((s) => (
            <li key={s}>
              <Chip className="bg-blue-100/60">{s}</Chip>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-navy text-sm font-bold">Fichiers joints ({files.length})</h3>
        {files.length === 0 ? (
          <p className="text-muted mt-1 text-xs">Aucun fichier joint.</p>
        ) : (
          <ul className="mt-2 grid grid-cols-4 gap-2">
            {files.map((f) => (
              <li key={f.id} className="min-w-0">
                {f.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
                  <img src={f.preview} alt="" className="h-14 w-full rounded-lg object-cover" />
                ) : (
                  <span className="flex h-14 w-full items-center justify-center rounded-lg bg-red-50 text-red-500">
                    <FileText className="size-5" aria-hidden />
                  </span>
                )}
                <span className="text-muted mt-1 block truncate text-[10px]">{f.file.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <section className="space-y-1 rounded-xl bg-blue-50 p-4">
        <h3 className="text-navy flex items-center gap-2 text-sm font-bold">
          <Lightbulb className="text-brand size-4" aria-hidden /> Conseil
        </h3>
        <p className="text-navy text-xs">
          Une preuve bien documentée et visible publiquement augmente vos chances d&apos;être repéré par les
          recruteurs et les entreprises.
        </p>
      </section>
    </section>
  );
}

