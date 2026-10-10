import Link from "next/link";
import { Bookmark, CheckCircle2, Download, Lightbulb, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BusinessContext } from "@/lib/business/context";
import {
  historyStats,
  parsePeriod,
  PERIODS,
  statusBreakdown,
  type Delta,
} from "@/lib/business/matching-view";
import { paginate } from "@/lib/project-view";
import { getOrganizationService } from "@/services/container";
import {
  MATCH_EVENT_LABELS,
  MATCH_EVENT_TYPES,
  MATCH_STATUS_LABELS,
  type MatchEventDTO,
  type MatchEventType,
} from "@/types/matching";
import { MemberAvatar, Panel } from "../ui";
import { Pagination } from "../pagination";
import { first, hrefWith, loadSaved, type Raw } from "./data";
import { getMatchingService } from "@/services/container";

const PER_PAGE = 10;
const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const TIME = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

const TYPE_TONE: Record<MatchEventType, string> = {
  SEARCH: "bg-blue-50 text-brand",
  RECOMMENDATION: "bg-violet-50 text-violet-700",
  SAVE: "bg-green-50 text-green-700",
  EXPORT: "bg-orange-50 text-orange-600",
};
const TYPE_FILL: Record<MatchEventType, string> = {
  SEARCH: "#2563eb",
  RECOMMENDATION: "#7c3aed",
  SAVE: "#10b981",
  EXPORT: "#f97316",
};
const STATUS_FILL = ["#2563eb", "#7c3aed", "#f59e0b", "#10b981", "#059669", "#94a3b8"];

function ago(iso: string, now: number) {
  const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (minutes < 60) return `il y a ${Math.max(1, minutes)} min`;
  if (minutes < 1440) return `il y a ${Math.floor(minutes / 60)} h`;
  return `il y a ${Math.floor(minutes / 1440)} j`;
}

function eventLink(e: MatchEventDTO): { href: string; label: string } | null {
  if (e.type === "SEARCH")
    return { href: `/business/matching${e.query ? `?${e.query}` : ""}`, label: "Voir les résultats" };
  if (e.type === "RECOMMENDATION")
    return {
      href: `/business/matching?${e.query ?? "tab=recommandations"}`,
      label: "Voir les recommandations",
    };
  if (e.type === "SAVE") return { href: "/business/matching?tab=sauvegardes", label: "Voir la liste" };
  return null;
}

function Stat({
  icon: Icon,
  tone,
  delta,
  label,
}: {
  icon: typeof Search;
  tone: string;
  delta: Delta;
  label: string;
}) {
  return (
    <Panel className="flex items-center gap-4 p-4">
      <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", tone)}>
        <Icon className="size-6" aria-hidden />
      </span>
      <div>
        <p className="flex items-baseline gap-2">
          <span className="text-navy text-2xl leading-none font-bold">
            {delta.value.toLocaleString("fr-FR")}
          </span>
          {delta.percent !== null && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-xs font-semibold",
                delta.percent < 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700",
              )}
            >
              {delta.percent >= 0 ? "+" : ""}
              {delta.percent}%
            </span>
          )}
        </p>
        <p className="text-muted mt-1 text-sm">{label}</p>
      </div>
    </Panel>
  );
}

function LineChart({ chart }: { chart: ReturnType<typeof historyStats>["chart"] }) {
  const w = 320;
  const h = 120;
  const series = [
    ["Recherches", chart.searches, TYPE_FILL.SEARCH],
    ["Recommandations", chart.recommendations, TYPE_FILL.RECOMMENDATION],
    ["Sauvegardes", chart.saves, TYPE_FILL.SAVE],
  ] as const;
  const max = Math.max(1, ...series.flatMap(([, v]) => v));
  const x = (i: number) => (chart.days.length <= 1 ? 0 : (i / (chart.days.length - 1)) * w);
  const y = (v: number) => h - (v / max) * (h - 6) - 3;
  return (
    <figure>
      <ul className="text-muted mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map(([label, , color]) => (
          <li key={label} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: color }} aria-hidden /> {label}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" role="img" aria-label="Activité par jour">
        <line x1="0" x2={w} y1={h - 3} y2={h - 3} stroke="#e2e8f0" />
        {series.map(([label, values, color]) => (
          <polyline
            key={label}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          />
        ))}
      </svg>
      <figcaption className="text-muted mt-1 flex justify-between text-xs">
        <span>{DATE.format(new Date(chart.days[0]!))}</span>
        <span>{DATE.format(new Date(chart.days[chart.days.length - 1]!))}</span>
      </figcaption>
    </figure>
  );
}

function Donut({ parts, total }: { parts: (readonly [MatchEventType, number])[]; total: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="14" stroke="#f1f5f9" />
          {total > 0 &&
            parts.map(([type, n]) => {
              const len = (n / total) * c;
              const el = (
                <circle
                  key={type}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  strokeWidth="14"
                  stroke={TYPE_FILL[type]}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <p className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-navy text-2xl leading-none font-bold">{total}</span>
          <span className="text-muted text-xs">Actions</span>
        </p>
      </div>
      <ul className="space-y-1.5 text-sm">
        {parts.map(([type, n]) => (
          <li key={type} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: TYPE_FILL[type] }} aria-hidden />
            <span className="text-navy">{MATCH_EVENT_LABELS[type]}</span>
            <span className="text-muted ml-auto pl-4">{total ? Math.round((n / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function HistoryTab({ ctx, raw }: { ctx: BusinessContext; raw: Raw }) {
  const orgId = ctx.organization.id;
  const days = parsePeriod(first(raw.periode));
  const now = new Date();
  // Twice the period: the second half is the comparison for the percentage changes.
  const since = new Date(now.getTime() - days * 2 * 86_400_000).toISOString();
  const [events, members, saved] = await Promise.all([
    getMatchingService().listEvents(orgId, since),
    getOrganizationService().listMembers(orgId),
    loadSaved(orgId),
  ]);
  const stats = historyStats(events, days, now);
  const typeFilter = MATCH_EVENT_TYPES.find((t) => t === first(raw.type));
  const rows = typeFilter ? stats.current.filter((e) => e.type === typeFilter) : stats.current;
  const { page, pages, items } = paginate(rows, Number(first(raw.page)), PER_PAGE);
  const memberOf = new Map(members.map((m) => [m.id, m]));
  const total = stats.byType.reduce((sum, [, n]) => sum + n, 0);
  const statuses = statusBreakdown(saved);
  const savedTotal = saved.length;
  const latest = events.slice(0, 4);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-4">
        <form method="get" action="/business/matching" className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="tab" value="historique" />
          <select
            name="periode"
            defaultValue={String(days)}
            aria-label="Période"
            className="border-border h-11 rounded-xl border bg-white px-3 text-sm"
          >
            {PERIODS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={typeFilter ?? ""}
            aria-label="Type d'action"
            className="border-border h-11 rounded-xl border bg-white px-3 text-sm"
          >
            <option value="">Tous les types</option>
            {MATCH_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {MATCH_EVENT_LABELS[t]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="border-brand/40 text-brand h-11 rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-blue-50"
          >
            Filtrer
          </button>
        </form>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={Search}
            tone="bg-blue-50 text-brand"
            delta={stats.searches}
            label="Recherches effectuées"
          />
          <Stat
            icon={Users}
            tone="bg-violet-50 text-violet-700"
            delta={stats.analysed}
            label="Talents analysés"
          />
          <Stat
            icon={CheckCircle2}
            tone="bg-green-50 text-green-700"
            delta={stats.recommendations}
            label="Recommandations générées"
          />
          <Stat
            icon={Bookmark}
            tone="bg-rose-50 text-rose-600"
            delta={stats.saves}
            label="Talents sauvegardés"
          />
        </div>

        <Panel className="overflow-hidden">
          {items.length === 0 ? (
            <p className="text-muted p-8 text-center text-sm">
              Aucune action sur cette période. Vos recherches, recommandations et sauvegardes apparaîtront
              ici.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-muted border-border/60 border-b text-xs">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Détails</th>
                    <th className="px-4 py-3 font-semibold">Résultats</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                    <th className="px-4 py-3 font-semibold">Utilisé par</th>
                  </tr>
                </thead>
                <tbody className="divide-border/50 divide-y">
                  {items.map((e) => {
                    const link = eventLink(e);
                    const who = e.memberId ? memberOf.get(e.memberId) : undefined;
                    return (
                      <tr key={e.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-navy font-medium">{DATE.format(new Date(e.createdAt))}</p>
                          <p className="text-muted text-xs">{TIME.format(new Date(e.createdAt))}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", TYPE_TONE[e.type])}
                          >
                            {MATCH_EVENT_LABELS[e.type]}
                          </span>
                        </td>
                        <td className="max-w-64 px-4 py-3">
                          <p className="text-navy truncate font-semibold">{e.title}</p>
                          <p className="text-muted truncate text-xs">{e.subtitle}</p>
                        </td>
                        <td className="text-navy px-4 py-3 whitespace-nowrap">
                          {e.results === null ? "—" : `${e.results} talent${e.results > 1 ? "s" : ""}`}
                        </td>
                        <td className="px-4 py-3">
                          {link && (
                            <Link
                              href={link.href}
                              className="border-brand/40 text-brand rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap hover:bg-blue-50"
                            >
                              {link.label}
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {who ? (
                            <span className="flex items-center gap-2 whitespace-nowrap">
                              <MemberAvatar member={who} className="size-8 text-xs" />
                              {who.firstName} {who.lastName}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            page={page}
            pages={pages}
            total={rows.length}
            size={PER_PAGE}
            noun="actions"
            hrefFor={(n) => hrefWith(raw, { page: n > 1 ? String(n) : null })}
          />
        </Panel>
      </div>

      <aside className="space-y-4">
        <Panel className="p-5">
          <h3 className="text-navy mb-3 font-bold">Aperçu de votre activité</h3>
          <LineChart chart={stats.chart} />
        </Panel>
        <Panel className="p-5">
          <h3 className="text-navy mb-3 font-bold">Types d&apos;actions</h3>
          <Donut parts={stats.byType} total={total} />
        </Panel>
        <Panel className="p-5">
          <h3 className="text-navy mb-3 font-bold">Statuts des correspondances</h3>
          {savedTotal === 0 ? (
            <p className="text-muted text-sm">Aucun talent sauvegardé pour le moment.</p>
          ) : (
            <>
              <div
                className="flex h-2.5 overflow-hidden rounded-full bg-slate-100"
                role="img"
                aria-label="Répartition des statuts"
              >
                {statuses.map(([s, n], i) => (
                  <span key={s} style={{ width: `${(n / savedTotal) * 100}%`, background: STATUS_FILL[i] }} />
                ))}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {statuses.map(([s, n], i) => (
                  <li key={s} className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: STATUS_FILL[i] }}
                      aria-hidden
                    />
                    <span className="text-navy">{MATCH_STATUS_LABELS[s]}</span>
                    <span className="text-muted ml-auto">{n}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
        <Panel className="p-5">
          <h3 className="text-navy mb-3 font-bold">Mes dernières actions</h3>
          {latest.length === 0 ? (
            <p className="text-muted text-sm">Aucune action récente.</p>
          ) : (
            <ul className="space-y-3">
              {latest.map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-sm">
                  {e.type === "SAVE" ? (
                    <Bookmark className="size-4 text-green-600" aria-hidden />
                  ) : e.type === "EXPORT" ? (
                    <Download className="size-4 text-orange-600" aria-hidden />
                  ) : e.type === "RECOMMENDATION" ? (
                    <Lightbulb className="size-4 text-violet-600" aria-hidden />
                  ) : (
                    <Search className="text-brand size-4" aria-hidden />
                  )}
                  <span className="text-navy min-w-0 flex-1 truncate">{e.title}</span>
                  <span className="text-muted text-xs whitespace-nowrap">
                    {ago(e.createdAt, now.getTime())}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </aside>
    </div>
  );
}
