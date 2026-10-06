import Link from "next/link";
import { ArrowRight, Lightbulb, Trophy } from "lucide-react";
import { monthLabel } from "@/lib/project-view";
import type { ProjectDTO } from "@/types/portfolio";
import { AddProjectButton } from "./project-editor";

const card = "border-border/60 shadow-soft rounded-2xl border bg-white p-5";

export function AddProjectPanel() {
  return (
    <section className="border-border/60 shadow-soft rounded-2xl border bg-white p-3">
      <AddProjectButton className="w-full" />
    </section>
  );
}

export function FeatureTip() {
  return (
    <section className="rounded-2xl bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <Trophy className="size-9 shrink-0 text-amber-500" aria-hidden />
        <div>
          <h2 className="text-navy leading-snug font-bold">Mettez en avant vos meilleurs projets !</h2>
          <p className="text-muted mt-2 text-sm">
            Un projet bien documenté attire plus d&apos;opportunités et renforce votre profil.
          </p>
          <Link
            href="/dashboard/skillpass"
            className="text-brand mt-3 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            Voir mon SkillPass <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

const DOMAIN_COLORS = ["#2563EB", "#0EA5E9", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"];

/** Donut of the projects by domain. Pure SVG, so it renders on the server. */
export function DomainBreakdown({
  domains,
  total,
}: {
  domains: { name: string; count: number }[];
  total: number;
}) {
  const size = 120;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const counted = domains.reduce((sum, d) => sum + d.count, 0);
  const arcs = domains.reduce<{ name: string; len: number; start: number; color: string }[]>((acc, d, i) => {
    const len = (d.count / counted) * c;
    const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].len : 0;
    return [...acc, { name: d.name, len, start, color: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }];
  }, []);

  return (
    <section aria-labelledby="domains-title" className={card}>
      <h2 id="domains-title" className="text-navy font-bold">
        Répartition par domaine
      </h2>
      {domains.length === 0 ? (
        <p className="text-muted mt-3 text-sm">
          Indiquez un domaine sur vos projets pour voir la répartition.
        </p>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label="Répartition des projets par domaine"
            >
              <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={stroke}>
                <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" />
                {arcs.map((a) => (
                  <circle
                    key={a.name}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={a.color}
                    strokeDasharray={`${a.len} ${c - a.len}`}
                    strokeDashoffset={-a.start}
                  />
                ))}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
              <span className="text-navy text-xl font-bold">{total}</span>
              <span className="text-muted text-[11px]">Projets</span>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
            {arcs.map((a, i) => (
              <li key={a.name} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: a.color }}
                />
                <span className="text-navy truncate">{a.name}</span>
                <span className="text-navy ml-auto font-semibold">{domains[i].count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function TopTechnologies({ items }: { items: { name: string; percent: number }[] }) {
  return (
    <section aria-labelledby="tech-title" className={card}>
      <h2 id="tech-title" className="text-navy font-bold">
        Technologies les plus utilisées
      </h2>
      {items.length === 0 ? (
        <p className="text-muted mt-3 text-sm">Reliez des technologies à vos projets pour les voir ici.</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {items.map((t) => (
            <li key={t.name}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-navy truncate font-medium">{t.name}</span>
                <span className="text-navy shrink-0 text-xs font-semibold">{t.percent}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={t.name}
                aria-valuenow={t.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-blue-100"
              >
                <div className="bg-brand h-full rounded-full" style={{ width: `${t.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function NextProject({ project }: { project: ProjectDTO | null }) {
  return (
    <section aria-labelledby="next-title" className={card}>
      <h2 id="next-title" className="text-navy flex items-center gap-2 font-bold">
        <Lightbulb className="size-5 text-amber-500" aria-hidden /> Mon prochain projet
      </h2>
      {project ? (
        <>
          <p className="text-navy mt-3 font-bold">{project.name}</p>
          {project.startDate && (
            <p className="text-muted mt-1 text-sm">Démarrage prévu en {monthLabel(project.startDate)}</p>
          )}
          {project.description && <p className="text-muted mt-2 text-sm">{project.description}</p>}
        </>
      ) : (
        <p className="text-muted mt-3 text-sm">
          Aucun projet planifié. Ajoutez un projet avec une date de début à venir pour le voir ici.
        </p>
      )}
    </section>
  );
}
