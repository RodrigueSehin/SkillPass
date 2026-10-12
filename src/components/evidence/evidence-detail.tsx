import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  Link2,
  Pencil,
  Tag,
  UserRound,
} from "lucide-react";
import { fileUrl, formatPeriod, formatSize } from "@/lib/evidence-view";
import { EVIDENCE_VISIBILITY_LABELS, type EvidenceDTO, type EvidenceFileDTO } from "@/types/evidence";
import { EvidenceActions } from "./evidence-actions";
import { Chip, EvidenceCover, StatusBadge, TypeBadge } from "./evidence-bits";

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Globe;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-2 text-sm">
      <dt className="text-muted flex items-center gap-2">
        <Icon className="size-4" aria-hidden /> {label}
      </dt>
      <dd className="text-navy min-w-0 break-words">{children}</dd>
    </div>
  );
}

function FileGroup({
  title,
  evidenceId,
  files,
}: {
  title: string;
  evidenceId: string;
  files: EvidenceFileDTO[];
}) {
  if (files.length === 0) return null;
  return (
    <section className="border-border/70 rounded-xl border p-3">
      <h4 className="text-navy text-xs font-bold">
        {title} ({files.length})
      </h4>
      <ul className="mt-2 space-y-2">
        {files.map((f) => (
          <li key={f.id}>
            <a
              href={fileUrl(evidenceId, f.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg hover:bg-blue-50/60"
            >
              {f.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- private, authenticated file served by our API
                <img
                  src={fileUrl(evidenceId, f.id)}
                  alt=""
                  loading="lazy"
                  className="h-12 w-16 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500">
                  <FileText className="size-5" aria-hidden />
                </span>
              )}
              <span className="min-w-0">
                <span className="text-navy block truncate text-xs font-medium">{f.name}</span>
                <span className="text-muted text-[11px]">{formatSize(f.sizeBytes)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Right-hand panel of the evidence page: everything known about the selected evidence. */
export function EvidenceDetail({ evidence: e }: { evidence: EvidenceDTO }) {
  const period = formatPeriod(e);
  const images = e.files.filter((f) => f.isImage);
  const documents = e.files.filter((f) => !f.isImage);

  return (
    <article
      aria-label={`Détail de la preuve ${e.title}`}
      className="border-border/60 shadow-soft overflow-hidden rounded-2xl border bg-white"
    >
      <EvidenceCover evidence={e} className="h-44" />
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-2">
          <TypeBadge type={e.type} />
          <StatusBadge evidence={e} />
        </div>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-navy text-xl leading-tight font-extrabold">{e.title}</h2>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/dashboard/evidence/${e.id}/edit`}
              className="border-brand/40 text-brand inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold hover:bg-blue-50"
            >
              <Pencil className="size-4" aria-hidden /> Modifier
            </Link>
            <EvidenceActions id={e.id} title={e.title} published={e.published} />
          </div>
        </div>
        {e.description && <p className="text-muted text-sm whitespace-pre-line">{e.description}</p>}

        <dl className="space-y-2.5">
          {e.role && (
            <Row icon={UserRound} label="Rôle">
              {e.role}
            </Row>
          )}
          {e.organization && (
            <Row icon={Building2} label="Organisation">
              {e.organization}
            </Row>
          )}
          {period && (
            <Row icon={CalendarDays} label="Période">
              {period}
            </Row>
          )}
          {e.category && (
            <Row icon={Layers} label="Catégorie">
              {e.category}
            </Row>
          )}
          <Row icon={Globe} label="Visibilité">
            {EVIDENCE_VISIBILITIES_TITLE[e.visibility]}
          </Row>
          {e.url && (
            <Row icon={Link2} label="Lien">
              <a
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand inline-flex items-center gap-1 font-medium break-all hover:underline"
              >
                {e.url.replace(/^https?:\/\//, "")} <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </a>
            </Row>
          )}
        </dl>

        {e.technologies.length > 0 && (
          <section>
            <h3 className="text-navy text-sm font-bold">Technologies</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {e.technologies.map((t) => (
                <li key={t}>
                  <Chip>{t}</Chip>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-navy text-sm font-bold">Compétences démontrées ({e.skills.length})</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {e.skills.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/skills/${s.id}`}
                  className="text-brand rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-medium hover:bg-blue-100"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {e.tags.length > 0 && (
          <section>
            <h3 className="text-navy flex items-center gap-1.5 text-sm font-bold">
              <Tag className="size-3.5" aria-hidden /> Tags
            </h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {e.tags.map((t) => (
                <li
                  key={t}
                  className="text-muted rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium"
                >
                  {t}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-label="Fichiers" className="space-y-3">
          <h3 className="text-navy flex items-center gap-1.5 text-sm font-bold">
            <FolderOpen className="size-4" aria-hidden /> Fichiers joints ({e.files.length})
          </h3>
          {e.files.length === 0 ? (
            <p className="text-muted text-xs">Aucun fichier joint.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <FileGroup title="Captures d'écran" evidenceId={e.id} files={images} />
              <FileGroup title="Documents" evidenceId={e.id} files={documents} />
            </div>
          )}
        </section>

        <p className="text-muted border-border/70 border-t pt-3 text-[11px]">
          Statistiques de consultation (vues, téléchargements, partages) : bientôt.
        </p>
      </div>
    </article>
  );
}

const EVIDENCE_VISIBILITIES_TITLE = {
  PUBLIC: EVIDENCE_VISIBILITY_LABELS.PUBLIC.title,
  RECRUITERS: EVIDENCE_VISIBILITY_LABELS.RECRUITERS.title,
  PRIVATE: EVIDENCE_VISIBILITY_LABELS.PRIVATE.title,
} as const;
