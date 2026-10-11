import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, ClipboardList, Medal, Users } from "lucide-react";
import { ComboChart, Donut, RateBar, RateBars } from "@/components/business/charts";
import { RangeSelect } from "@/components/business/range-select";
import { NoAccess, Panel, StatCard } from "@/components/business/ui";
import { TalentAvatar } from "@/components/business/talent-cards";
import { skillVisual } from "@/config/skill-visuals";
import { ANALYTICS_RANGES, computeAnalytics, parseRange, type Kpi } from "@/lib/business/analytics";
import { requireBusiness } from "@/lib/business/context";
import { requireBusinessFeature } from "@/lib/business/features";
import { cn } from "@/lib/utils/cn";
import { getEvaluationService, getJobOfferService } from "@/services/container";
import { EVALUATION_STATUS_LABELS, EVALUATION_TYPE_LABELS } from "@/types/evaluation";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const MAX_ATTEMPTS = 5000;

const chip = (k: Kpi) =>
  k.delta === null
    ? null
    : {
        text: `${k.delta >= 0 ? "↑" : "↓"} ${Math.abs(k.delta)}%`,
        tone: k.delta < 0 ? ("down" as const) : ("up" as const),
      };

export default async function AnalyticsPage({ searchParams }: PageProps<"/business/analytics">) {
  const ctx = await requireBusiness();
  requireBusinessFeature(ctx, "analytics");
  if (!ctx.can("analytics.view")) return <NoAccess what="de consulter les analytics" />;
  const raw = await searchParams;
  const range = parseRange(first(raw.range));
  const orgId = ctx.organization.id;
  const [evaluations, attempts, offers] = await Promise.all([
    getEvaluationService().list(orgId),
    getEvaluationService().recentAttempts(orgId, MAX_ATTEMPTS),
    getJobOfferService().list(orgId),
  ]);
  const a = computeAnalytics({ evaluations, attempts, offers, days: Number(range), now: new Date() });
  const rangeLabel = ANALYTICS_RANGES.find(([k]) => k === range)![1].toLowerCase();
  const peak = Math.max(1, ...a.topSkills.map((s) => s.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="text-muted mt-1">
            Suivez la performance de vos évaluations, la progression des talents et l&apos;impact de SkillPass
            dans votre organisation.
          </p>
        </div>
        <RangeSelect current={range} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          tone="bg-blue-50 text-brand"
          value={a.kpis.candidates.value ?? 0}
          label="Talents évalués"
          chip={chip(a.kpis.candidates)}
          caption="par rapport à la période précédente"
        />
        <StatCard
          icon={ClipboardList}
          tone="bg-orange-100 text-orange-600"
          value={a.kpis.created.value ?? 0}
          label="Évaluations créées"
          chip={chip(a.kpis.created)}
          caption="par rapport à la période précédente"
        />
        <StatCard
          icon={Medal}
          tone="bg-blue-50 text-brand"
          value={a.kpis.successRate.value === null ? "—" : `${a.kpis.successRate.value}%`}
          label="Taux de réussite moyen"
          chip={chip(a.kpis.successRate)}
          caption={
            a.kpis.successRate.value === null
              ? "aucun résultat noté sur la période"
              : "par rapport à la période précédente"
          }
        />
        <StatCard
          icon={BriefcaseBusiness}
          tone="bg-violet-100 text-violet-600"
          value={a.kpis.applications.value ?? 0}
          label="Candidatures reçues"
          chip={chip(a.kpis.applications)}
          caption="sur les offres publiées sur la période"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[1.25fr_1fr_1fr]">
        <Panel className="p-5 lg:col-span-2 xl:col-span-1">
          <h2 className="text-navy font-bold">Évolution des évaluations</h2>
          <ul className="text-muted mt-2 flex gap-4 text-xs">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-blue-300" /> Évaluations créées
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-green-600" /> Passages terminés
            </li>
          </ul>
          <div className="mt-3">
            <ComboChart
              labels={a.trend.labels}
              bars={a.trend.created}
              line={a.trend.evaluated}
              label={`Évaluations créées et passages terminés, ${rangeLabel}`}
            />
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Répartition des résultats</h2>
          <div className="mt-4 flex items-center gap-4">
            <Donut
              label="Répartition des résultats par tranche de score"
              center={a.gradedCount}
              caption="résultats notés"
              size={130}
              segments={a.bands.map((b) => ({ label: b.key, value: b.count, color: b.color }))}
            />
            <ul className="min-w-0 flex-1 space-y-2 text-xs">
              {a.bands.map((b) => (
                <li key={b.key} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: b.color }}
                  />
                  <span className="text-navy truncate">{b.label}</span>
                  <span className="text-navy ml-auto font-semibold">{b.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-navy font-bold">Compétences les plus évaluées</h2>
            <Link href="/business/competences" className="text-brand text-sm font-semibold hover:underline">
              Voir tout
            </Link>
          </div>
          {a.topSkills.length === 0 ? (
            <p className="text-muted mt-3 text-sm">Aucun passage sur la période.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {a.topSkills.map((s) => (
                <li key={s.skill} className="flex items-center gap-3 text-sm">
                  <span className="text-navy w-28 shrink-0 truncate">{s.skill}</span>
                  <span className="block h-2 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        skillVisual(s.skill).tile.split(" ")[0]!.replace("-100", "-400"),
                      )}
                      style={{ width: `${(s.count / peak) * 100}%` }}
                    />
                  </span>
                  <span className="text-navy w-8 text-right font-semibold">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Réussite par type d&apos;évaluation</h2>
          <div className="mt-3">
            <RateBars
              label="Taux de réussite par type d'évaluation"
              items={a.byType.map((t) => ({ label: EVALUATION_TYPE_LABELS[t.type].title, value: t.rate }))}
            />
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Top 5 des talents par score moyen</h2>
          {a.topTalents.length === 0 ? (
            <p className="text-muted mt-3 text-sm">Aucun résultat noté sur la période.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {a.topTalents.map((t) => (
                <li key={`${t.name}-${t.average}`} className="flex items-center gap-3">
                  <TalentAvatar name={t.name} className="size-9 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="text-navy block truncate text-sm font-semibold">{t.name}</span>
                    <span className="text-muted block text-xs">
                      {t.count} évaluation{t.count > 1 ? "s" : ""} notée{t.count > 1 ? "s" : ""}
                    </span>
                  </span>
                  <span className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    {t.average}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Candidatures par offre</h2>
          {a.topOffers.length === 0 ? (
            <p className="text-muted mt-3 text-sm">Aucune candidature reçue pour l&apos;instant.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {a.topOffers.map((o) => (
                <li key={o.id} className="flex items-center gap-3 text-sm">
                  <span className="text-navy min-w-0 flex-1 truncate">{o.title}</span>
                  <RateBar
                    value={(o.applicants / a.topOffers[0]!.applicants) * 100}
                    good={0}
                    className="w-24"
                  />
                  <span className="text-navy w-8 text-right font-semibold">{o.applicants}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted mt-4 text-xs">
            Seule la diffusion sur SkillPass est mesurée : les autres canaux ne remontent pas de candidatures.
          </p>
        </Panel>
      </div>

      <Panel className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-navy font-bold">Dernières évaluations</h2>
          <Link
            href="/business/evaluations?tab=results"
            className="text-brand text-sm font-semibold hover:underline"
          >
            Voir toutes les évaluations
          </Link>
        </div>
        {a.recent.length === 0 ? (
          <p className="text-muted mt-3 text-sm">Les passages de vos candidats apparaîtront ici.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-navy bg-slate-50 text-xs font-semibold">
                  <th scope="col" className="px-3 py-2.5">
                    Talent
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Évaluation
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Compétence
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Score
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Statut
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {a.recent.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/business/evaluations/resultats/${r.id}`}
                        className="flex items-center gap-2.5 hover:underline"
                      >
                        <TalentAvatar name={r.candidateName} className="size-8 text-xs" />
                        <span className="text-navy font-semibold">{r.candidateName}</span>
                      </Link>
                    </td>
                    <td className="text-muted px-3 py-2.5">{r.evaluation?.title ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {r.evaluation?.skill && (
                        <span className="text-brand rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">
                          {r.evaluation.skill}
                        </span>
                      )}
                    </td>
                    <td className="text-navy px-3 py-2.5 font-semibold">
                      {r.score === null ? "—" : `${r.score}%`}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-semibold",
                          r.status === "GRADED" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700",
                        )}
                      >
                        {r.status === "GRADED" ? "Terminée" : "À corriger"}
                      </span>
                    </td>
                    <td className="text-muted px-3 py-2.5 whitespace-nowrap">
                      {r.submittedAt ? DATE.format(new Date(r.submittedAt)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="text-muted text-xs">
        Statuts d&apos;évaluation : {Object.values(EVALUATION_STATUS_LABELS).join(", ").toLowerCase()}. Les
        chiffres couvrent les {rangeLabel} et se comparent à la période de même durée qui précède.
      </p>
    </div>
  );
}
