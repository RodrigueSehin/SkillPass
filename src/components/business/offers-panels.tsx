import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { JOB_STATUS_LABELS, type JobDisplayStatus, type JobOfferRow } from "@/types/job-offer";
import { OrgLogo } from "./org-logo";
import { Panel } from "./ui";

export function TopOffers({ offers }: { offers: JobOfferRow[] }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-navy font-bold">Top 5 des offres</h2>
        <Link
          href="/business/offres?tab=PUBLISHED"
          className="text-brand text-sm font-semibold hover:underline"
        >
          Voir tout
        </Link>
      </div>
      {offers.length === 0 ? (
        <p className="text-muted mt-3 text-sm">Les offres les plus suivies apparaîtront ici.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {offers.map((o, i) => (
            <li key={o.id} className="flex items-center gap-3">
              <span className="text-brand flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-navy truncate text-sm font-semibold">{o.title}</p>
                <p className="text-muted text-xs">
                  {o.applicants} candidat{o.applicants > 1 ? "s" : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/**
 * Where applications come from. SkillPass only measures its own channel, so the donut is honest about it:
 * other sources stay at zero until they are connected.
 */
export function ApplicationSources({ total }: { total: number }) {
  const size = 132;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sources = [
    ["SkillPass", total, "#2563EB"],
    ["LinkedIn", 0, "#60A5FA"],
    ["Site carrière", 0, "#F59E0B"],
    ["Autres", 0, "#94A3B8"],
  ] as const;
  return (
    <Panel className="p-5">
      <h2 className="text-navy font-bold">Sources de candidatures</h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="Sources des candidatures"
          >
            <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={stroke}>
              <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" />
              {total > 0 && (
                <circle cx={size / 2} cy={size / 2} r={r} stroke="#2563EB" strokeDasharray={`${c} 0`} />
              )}
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
            <span className="text-navy text-2xl font-extrabold">{total}</span>
            <span className="text-muted text-[11px]">candidatures</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {sources.map(([name, count, color]) => (
            <li key={name} className="flex items-center gap-2.5">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
              <span className="text-navy truncate">{name}</span>
              <span className="text-navy ml-auto font-semibold">
                {total ? Math.round((count / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

const PILL: Record<JobDisplayStatus, string> = {
  PUBLISHED: "bg-green-50 text-green-700",
  DRAFT: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-600",
  CLOSED: "bg-slate-100 text-slate-600",
};

export function RecentOffers({
  offers,
  organization,
  dateLabel,
}: {
  offers: JobOfferRow[];
  organization: { name: string; logoVersion: string | null };
  dateLabel: (o: JobOfferRow) => string;
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-navy font-bold">Offres récentes</h2>
        <Link href="/business/offres" className="text-brand text-sm font-semibold hover:underline">
          Voir tout
        </Link>
      </div>
      {offers.length === 0 ? (
        <p className="text-muted mt-3 text-sm">Aucune offre pour l&apos;instant.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {offers.map((o) => (
            <li key={o.id} className="flex items-center gap-3 py-2.5">
              <OrgLogo
                name={organization.name}
                version={organization.logoVersion}
                className="size-10 text-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="text-navy truncate text-sm font-semibold">{o.title}</p>
                <p className="text-muted text-xs">{dateLabel(o)}</p>
              </div>
              <span className={cn("rounded-md px-2 py-1 text-[11px] font-semibold", PILL[o.displayStatus])}>
                {JOB_STATUS_LABELS[o.displayStatus]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
