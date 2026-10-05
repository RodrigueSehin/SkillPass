import { CalendarClock, TrendingUp } from "lucide-react";
import { daysUntilExpiry, type CertificationStats } from "@/lib/certification-status";
import { cn } from "@/lib/utils/cn";
import { formatDay } from "@/lib/utils/format";
import type { CertificationDTO } from "@/types/portfolio";

const COLORS = {
  active: { stroke: "#16A34A", dot: "bg-green-600", label: "Obtenues" },
  expiring: { stroke: "#F59E0B", dot: "bg-amber-500", label: "Expirant bientôt" },
  expired: { stroke: "#DC2626", dot: "bg-red-600", label: "Expirées" },
} as const;

/** Donut of the portfolio by state. Pure SVG, so it renders on the server. */
export function CertificationStatus({ stats, year }: { stats: CertificationStats; year: string }) {
  const size = 132;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const keys = ["active", "expiring", "expired"] as const;
  const arcs = keys
    .filter((k) => stats[k] > 0)
    .reduce<{ key: (typeof keys)[number]; len: number; start: number }[]>((acc, key) => {
      const len = (stats[key] / stats.total) * c;
      const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].len : 0;
      return [...acc, { key, len, start }];
    }, []);

  return (
    <section
      aria-labelledby="cert-status"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
    >
      <h2 id="cert-status" className="text-navy font-bold">
        Mon statut de certification
      </h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            role="img"
            aria-label={`${stats.total} certifications par état`}
          >
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
            {arcs.map(({ key, len, start }) => (
              <circle
                key={key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={COLORS[key].stroke}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-start}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-navy text-3xl leading-none font-extrabold">{stats.total}</span>
            <span className="text-muted text-xs">Certifications</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {keys.map((k) => (
            <li key={k} className="flex items-center gap-2">
              <span className={cn("size-2.5 shrink-0 rounded-full", COLORS[k].dot)} aria-hidden />
              <span className="text-navy flex-1">{COLORS[k].label}</span>
              <span className="text-navy font-bold">{stats[k]}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm">
        <TrendingUp className="text-success size-6 shrink-0" aria-hidden />
        <span className="text-navy">
          <span className="text-success text-lg font-extrabold">{stats.issuedThisYear}</span> obtenue
          {stats.issuedThisYear > 1 ? "s" : ""} en {year}
        </span>
      </p>
    </section>
  );
}

/** The next expiry dates, soonest first (already-lapsed certifications are not "upcoming"). */
export function UpcomingExpiries({ items, today }: { items: CertificationDTO[]; today: string }) {
  const upcoming = items
    .filter((c) => c.expirationDate && (daysUntilExpiry(c, today) ?? -1) >= 0)
    .sort((a, b) => a.expirationDate!.localeCompare(b.expirationDate!))
    .slice(0, 3);

  return (
    <section
      aria-labelledby="cert-upcoming"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
    >
      <h2 id="cert-upcoming" className="text-navy font-bold">
        Échéances à venir
      </h2>
      {upcoming.length === 0 ? (
        <p className="text-muted mt-3 text-sm">Aucune certification n&apos;arrive à expiration.</p>
      ) : (
        <ul className="divide-border/60 mt-2 divide-y">
          {upcoming.map((c) => {
            const left = daysUntilExpiry(c, today)!;
            return (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <CalendarClock className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-navy block truncate text-sm font-semibold">{c.name}</span>
                  <span className={cn("block text-xs", left <= 90 ? "text-amber-700" : "text-muted")}>
                    Expire dans {left} jour{left > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-muted shrink-0 text-xs">{formatDay(c.expirationDate)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
