import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ClipboardList, Plus, Star, Users } from "lucide-react";
import { EvaluationsTable, type EvaluationTableRow } from "@/components/business/evaluations-table";
import { EvaluationsToolbar } from "@/components/business/evaluations-toolbar";
import { QuickActions, SuccessBySkill, TypeDistribution } from "@/components/business/evaluations-side";
import { Pagination } from "@/components/business/pagination";
import { LinkTabs, NoAccess, Panel, StatCard } from "@/components/business/ui";
import { buttonVariants } from "@/components/ui/button";
import { skillVisual } from "@/config/skill-visuals";
import { EVALUATION_TEMPLATES } from "@/config/evaluation-templates";
import { requireBusiness } from "@/lib/business/context";
import {
  EVALUATION_TABS,
  EVALUATIONS_PER_PAGE,
  evaluationStats,
  filterEvaluations,
  parseEvaluationTab,
  skillOptions,
  successBySkill,
  typeDistribution,
} from "@/lib/business/evaluation-view";
import { paginate } from "@/lib/project-view";
import { cn } from "@/lib/utils/cn";
import { getEvaluationService } from "@/services/container";
import { EVALUATION_TYPE_LABELS, type EvaluationAttemptRow } from "@/types/evaluation";
import { SKILL_LEVEL_LABELS } from "@/types/skill";

export const metadata: Metadata = { title: "Évaluations" };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function EvaluationsPage({ searchParams }: PageProps<"/business/evaluations">) {
  const ctx = await requireBusiness();
  const canView =
    ctx.can("evaluations.results") || ctx.can("evaluations.create") || ctx.can("evaluations.edit");
  if (!canView) return <NoAccess what="de consulter les évaluations" />;

  const raw = await searchParams;
  const orgId = ctx.organization.id;
  const service = getEvaluationService();
  const tab = parseEvaluationTab(first(raw.tab));
  const [rows, attempts] = await Promise.all([
    service.list(orgId),
    tab === "results" ? service.recentAttempts(orgId, 50) : Promise.resolve([] as EvaluationAttemptRow[]),
  ]);
  const canCreate = ctx.can("evaluations.create");
  const canEdit = ctx.can("evaluations.edit");
  const stats = evaluationStats(rows);

  const filtered = filterEvaluations(rows, {
    q: first(raw.q),
    type: first(raw.type),
    skill: first(raw.skill),
    status: first(raw.status),
    range: first(raw.range),
  });
  const { page, pages, items } = paginate(filtered, Number(first(raw.page)), EVALUATIONS_PER_PAGE);
  const tableRows: EvaluationTableRow[] = items.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    skill: e.skill,
    type: e.type,
    candidates: e.candidates,
    successRate: e.successRate,
    status: e.displayStatus,
  }));
  const hrefFor = (n: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      const v = first(value);
      if (v && key !== "page") next.set(key, v);
    }
    if (n > 1) next.set("page", String(n));
    const qs = next.toString();
    return qs ? `/business/evaluations?${qs}` : "/business/evaluations";
  };
  const titles = new Map(rows.map((e) => [e.id, e.title]));
  const bySkill = successBySkill(rows, tab === "stats" ? 12 : 5);
  const distribution = typeDistribution(rows);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Évaluations</h1>
          <p className="text-muted mt-1">
            Créez, gérez et analysez les évaluations pour mesurer les compétences des talents.
          </p>
        </div>
        {canCreate && (
          <Link href="/business/evaluations/nouvelle" className={cn(buttonVariants(), "h-12 px-6")}>
            <Plus /> Créer une évaluation
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          tone="bg-blue-50 text-brand"
          value={stats.created}
          label="Évaluations créées"
        />
        <StatCard
          icon={Users}
          tone="bg-blue-50 text-brand"
          value={stats.candidates.toLocaleString("fr-FR")}
          label="Candidats évalués"
        />
        <StatCard
          icon={BadgeCheck}
          tone="bg-violet-100 text-violet-600"
          value={stats.successRate === null ? "—" : `${stats.successRate}%`}
          label="Taux de réussite moyen"
          caption={stats.successRate === null ? "aucun résultat pour l'instant" : undefined}
        />
        <StatCard
          icon={Star}
          tone="bg-amber-100 text-amber-600"
          value={stats.published}
          label="Évaluations publiées"
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="min-w-0">
          <div className="px-5 pt-1">
            <LinkTabs
              label="Sections des évaluations"
              current={tab}
              tabs={EVALUATION_TABS.map(([key, label]) => ({
                key,
                label,
                href: key === "mine" ? "/business/evaluations" : `/business/evaluations?tab=${key}`,
              }))}
            />
          </div>

          {tab === "mine" && (
            <>
              <div className="pt-4">
                <EvaluationsToolbar skills={skillOptions(rows)} />
              </div>
              <EvaluationsTable
                rows={tableRows}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={ctx.can("evaluations.delete")}
              />
              <Pagination
                page={page}
                pages={pages}
                total={filtered.length}
                size={EVALUATIONS_PER_PAGE}
                noun="évaluations"
                hrefFor={hrefFor}
              />
            </>
          )}

          {tab === "library" && (
            <ul className="grid gap-4 p-5 md:grid-cols-2">
              {EVALUATION_TEMPLATES.map((t) => {
                const visual = skillVisual(t.skill);
                return (
                  <li key={t.id} className="border-border/70 flex flex-col rounded-xl border p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl",
                          visual.tile,
                        )}
                      >
                        <visual.icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-navy font-semibold">{t.title}</h3>
                        <p className="text-muted text-xs">
                          {EVALUATION_TYPE_LABELS[t.type].title} · {SKILL_LEVEL_LABELS[t.difficulty]} ·{" "}
                          {t.questions.length} questions · {t.durationMinutes} min
                        </p>
                      </div>
                    </div>
                    <p className="text-muted mt-3 flex-1 text-sm">{t.description}</p>
                    {canCreate && (
                      <Link
                        href={`/business/evaluations/nouvelle?modele=${t.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "border-brand text-brand mt-4 h-10",
                        )}
                      >
                        Utiliser ce modèle
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {tab === "results" && <ResultsTable attempts={attempts} titles={titles} />}

          {tab === "stats" && (
            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <TypeDistribution
                items={distribution}
                total={rows.filter((e) => e.displayStatus !== "ARCHIVED").length}
              />
              <SuccessBySkill items={bySkill} />
            </div>
          )}
        </Panel>

        <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <QuickActions canCreate={canCreate} />
          <TypeDistribution
            items={distribution}
            total={rows.filter((e) => e.displayStatus !== "ARCHIVED").length}
          />
          <SuccessBySkill
            items={bySkill}
            href="/business/evaluations?tab=stats"
            className="md:col-span-2 xl:col-span-1"
          />
        </aside>
      </div>
    </div>
  );
}

function ResultsTable({
  attempts,
  titles,
}: {
  attempts: EvaluationAttemptRow[];
  titles: Map<string, string>;
}) {
  if (attempts.length === 0) {
    return (
      <p className="text-muted px-5 py-12 text-center text-sm">
        Aucun candidat n&apos;a encore passé vos évaluations. Les résultats apparaîtront ici.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="text-navy border-y border-slate-100 text-xs font-semibold">
            <th scope="col" className="px-4 py-3">
              Candidat
            </th>
            <th scope="col" className="px-3 py-3">
              Évaluation
            </th>
            <th scope="col" className="px-3 py-3">
              Score
            </th>
            <th scope="col" className="px-3 py-3">
              Résultat
            </th>
            <th scope="col" className="px-3 py-3">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {attempts.map((a) => (
            <tr key={a.id}>
              <td className="text-navy px-4 py-3 font-medium">{a.candidateName}</td>
              <td className="text-muted px-3 py-3">{titles.get(a.evaluationId) ?? "—"}</td>
              <td className="text-navy px-3 py-3 font-medium">{a.score === null ? "—" : `${a.score}%`}</td>
              <td className="px-3 py-3">
                <span
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold",
                    a.status === "SUBMITTED"
                      ? "bg-amber-50 text-amber-700"
                      : a.passed
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-600",
                  )}
                >
                  {a.status === "SUBMITTED" ? "À corriger" : a.passed ? "Réussi" : "Non réussi"}
                </span>
              </td>
              <td className="text-muted px-3 py-3 whitespace-nowrap">
                {a.submittedAt ? DATE.format(new Date(a.submittedAt)) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
