import Link from "next/link";
import { skillVisual } from "@/config/skill-visuals";
import { cn } from "@/lib/utils/cn";
import { DEMAND_LABELS, type SkillRow } from "@/types/org-skill";
import { Donut, LineChart, seriesColor } from "./charts";
import { Panel } from "./ui";

const CATEGORY_COLORS = ["#2563EB", "#8B5CF6", "#F59E0B", "#10B981", "#EC4899", "#94A3B8"];

export function CategoryShare({
  items,
  total,
}: {
  items: { category: string; count: number; percent: number }[];
  total: number;
}) {
  return (
    <Panel className="p-5">
      <h2 className="text-navy font-bold">Répartition par catégorie</h2>
      <div className="mt-4 flex items-center gap-5">
        <Donut
          label="Répartition des compétences par catégorie"
          center={total.toLocaleString("fr-FR")}
          caption="compétences"
          size={120}
          segments={items.map((i, n) => ({
            label: i.category,
            value: i.count,
            color: CATEGORY_COLORS[n % CATEGORY_COLORS.length]!,
          }))}
        />
        <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
          {items.map((i, n) => (
            <li key={i.category} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: CATEGORY_COLORS[n % CATEGORY_COLORS.length] }}
              />
              <span className="text-navy truncate">{i.category}</span>
              <span className="text-navy ml-auto font-semibold">{i.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

export function MostDemanded({ rows, seeAllHref }: { rows: SkillRow[]; seeAllHref: string }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-navy font-bold">Compétences les plus demandées</h2>
        <Link href={seeAllHref} className="text-brand text-sm font-semibold hover:underline">
          Voir tout
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted mt-3 text-sm">Aucune offre publiée ne mentionne encore de compétences.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {rows.map((r, i) => {
            const visual = skillVisual(r.name);
            return (
              <li key={r.name} className="flex items-center gap-3">
                <span className="text-brand flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-navy block truncate text-sm font-semibold">{r.name}</span>
                  <span className="text-muted block text-xs">
                    {r.offers} offre{r.offers > 1 ? "s" : ""} · {r.talents.toLocaleString("fr-FR")} talent
                    {r.talents > 1 ? "s" : ""}
                  </span>
                </span>
                <span
                  className={cn(
                    "hidden size-7 shrink-0 items-center justify-center rounded-lg sm:flex",
                    visual.tile,
                  )}
                >
                  <visual.icon className="size-4" aria-hidden />
                </span>
                <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-red-600">
                  {DEMAND_LABELS[r.demand]}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

export function DemandTrend({
  labels,
  series,
}: {
  labels: string[];
  series: { name: string; values: number[] }[];
}) {
  const empty = series.every((s) => s.values.every((v) => v === 0));
  return (
    <Panel className="p-5">
      <h2 className="text-navy font-bold">Tendances de la demande</h2>
      <p className="text-muted text-xs">Offres publiées par mois, sur les 6 derniers mois</p>
      {empty ? (
        <p className="text-muted mt-4 text-sm">
          Pas encore assez d&apos;offres publiées pour dessiner une tendance.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <LineChart
              labels={labels}
              series={series}
              label="Offres publiées par mois pour les compétences les plus demandées"
            />
          </div>
          <ul className="space-y-1.5 text-xs">
            {series.map((s, i) => (
              <li key={s.name} className="flex items-center gap-2">
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: seriesColor(i) }} />
                <span className="text-navy">{s.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
