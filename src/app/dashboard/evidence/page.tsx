import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, FileText, ImageIcon, Lightbulb, Link2, Plus } from "lucide-react";
import { EvidenceActions } from "@/components/evidence/evidence-actions";
import { Chip, EvidenceCover, StatusBadge, TypeBadge } from "@/components/evidence/evidence-bits";
import { EvidenceDetail } from "@/components/evidence/evidence-detail";
import { EvidenceFilters } from "@/components/evidence/evidence-filters";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/current-user";
import { EVIDENCE_TABS, filterEvidence, tabOf } from "@/lib/evidence-view";
import { cn } from "@/lib/utils/cn";
import { getEvidenceService, getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Preuves" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function EvidencePage({ searchParams }: PageProps<"/dashboard/evidence">) {
  const user = await requireUser();
  const raw = await searchParams;
  const filters = {
    q: first(raw.q),
    skill: first(raw.skill),
    type: first(raw.type),
    status: first(raw.status),
  };
  const tab = EVIDENCE_TABS.find((t) => t.key === first(raw.tab))?.key;
  const selectedId = first(raw.sel);

  const [all, skills] = await Promise.all([
    getEvidenceService().list(user.id),
    getSkillService().list(user.id, { sort: "name" }),
  ]);

  // Tab counts follow the other filters, so they always match what each tab would show.
  const matching = filterEvidence(all, filters);
  const tabCounts = Object.fromEntries(EVIDENCE_TABS.map((t) => [t.key, 0])) as Record<string, number>;
  for (const e of matching) tabCounts[tabOf(e.type)]++;
  const shown = tab ? matching.filter((e) => tabOf(e.type) === tab) : matching;
  const selected = shown.find((e) => e.id === selectedId) ?? shown[0];

  const href = (next: { tab?: string; sel?: string }) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...next })) if (value) qs.set(key, value);
    const text = qs.toString();
    return text ? `/dashboard/evidence?${text}` : "/dashboard/evidence";
  };
  const addHref = filters.skill ? `/dashboard/evidence/new?skill=${filters.skill}` : "/dashboard/evidence/new";
  const add = (
    <Link href={addHref} className={buttonVariants()}>
      <Plus /> Ajouter une preuve
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="text-brand flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
            <FileCheck2 className="size-7" aria-hidden />
          </span>
          <div>
            <p className="text-navy text-sm font-semibold">Skill Evidence</p>
            <h1 className="text-navy text-2xl font-extrabold tracking-tight sm:text-3xl">
              Mes preuves de compétences
            </h1>
            <p className="text-muted mt-1">
              Présentez des preuves concrètes de vos compétences à travers vos projets, réalisations,
              certifications, etc.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {add}
          <aside className="flex max-w-sm items-start gap-3 rounded-2xl bg-blue-50 p-4">
            <Lightbulb className="text-brand size-6 shrink-0" aria-hidden />
            <p className="text-navy text-xs">
              Les preuves renforcent la crédibilité de votre profil et augmentent vos chances d&apos;être
              repéré par les recruteurs.
            </p>
          </aside>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <nav
            aria-label="Types de preuves"
            className="border-border/60 shadow-soft flex flex-wrap gap-x-6 gap-y-1 rounded-2xl border bg-white px-5"
          >
            {[
              { key: undefined, label: "Toutes les preuves", count: matching.length },
              ...EVIDENCE_TABS.filter((t) => t.key !== "OTHER" || tabCounts.OTHER > 0).map((t) => ({
                key: t.key as string | undefined,
                label: t.label,
                count: tabCounts[t.key],
              })),
            ].map((t) => {
              const active = t.key === tab;
              return (
                <Link
                  key={t.key ?? "all"}
                  href={href({ tab: t.key, sel: undefined })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px border-b-2 py-4 text-sm font-semibold whitespace-nowrap",
                    active ? "border-brand text-brand" : "text-navy/80 hover:text-brand border-transparent",
                  )}
                >
                  {t.label} ({t.count})
                </Link>
              );
            })}
          </nav>

          <EvidenceFilters skills={skills.items.map((s) => ({ id: s.id, name: s.name }))} />

          {all.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="Aucune preuve pour l'instant"
              description="Ajoutez un projet, une certification, une démo ou un document pour étayer vos compétences."
              action={add}
            />
          ) : shown.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="Aucun résultat"
              description="Modifiez vos filtres pour élargir la recherche."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {shown.map((e) => {
                const active = e.id === selected?.id;
                const images = e.files.filter((f) => f.isImage).length;
                const docs = e.files.length - images;
                return (
                  <li key={e.id} className="relative">
                    <article
                      className={cn(
                        "bg-white h-full rounded-2xl border p-3 transition-shadow",
                        active ? "border-brand shadow-lift" : "border-border/60 shadow-soft hover:shadow-lift",
                      )}
                    >
                      <Link
                        href={href({ sel: e.id })}
                        aria-current={active ? "true" : undefined}
                        aria-label={`Voir ${e.title}`}
                        scroll={false}
                        className="block"
                      >
                        <div className="flex items-center justify-between">
                          <TypeBadge type={e.type} />
                          <StatusBadge evidence={e} />
                        </div>
                        <EvidenceCover evidence={e} className="mt-3 h-36 rounded-xl" />
                        <h3 className="text-navy mt-3 font-bold">{e.title}</h3>
                        <p className="text-muted mt-1 line-clamp-2 min-h-10 text-sm">
                          {e.description ?? e.skills.map((s) => s.name).join(", ")}
                        </p>
                        {e.technologies.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-1.5">
                            {e.technologies.slice(0, 3).map((t) => (
                              <li key={t}>
                                <Chip>{t}</Chip>
                              </li>
                            ))}
                            {e.technologies.length > 3 && <Chip>+{e.technologies.length - 3}</Chip>}
                          </ul>
                        )}
                      </Link>
                      <div className="text-muted mt-3 flex items-center justify-between gap-2 pr-11 text-sm">
                        <span className="flex flex-wrap items-center gap-3">
                          {images > 0 && (
                            <span className="inline-flex items-center gap-1" title="Images">
                              <ImageIcon className="size-4" aria-hidden /> {images}
                            </span>
                          )}
                          {docs > 0 && (
                            <span className="inline-flex items-center gap-1" title="Documents">
                              <FileText className="size-4" aria-hidden /> {docs}
                            </span>
                          )}
                          {e.url && (
                            <span className="inline-flex items-center gap-1" title="Lien">
                              <Link2 className="size-4" aria-hidden /> 1
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="absolute right-3 bottom-3">
                        <EvidenceActions id={e.id} title={e.title} published={e.published} />
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected && (
          <div className="xl:sticky xl:top-4">
            <EvidenceDetail evidence={selected} />
          </div>
        )}
      </div>
    </div>
  );
}
