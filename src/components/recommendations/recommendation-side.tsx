import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  Handshake,
  Network,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { credibilityLabel } from "@/lib/recommendation-view";

const card = "border-border/60 shadow-soft rounded-2xl border bg-white p-5";

/** Average rating as a ring, with the number of recommendations per star count. */
export function CredibilityIndex({
  average,
  distribution,
}: {
  average: number | null;
  distribution: { stars: number; count: number }[];
}) {
  const size = 104;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = average === null ? 0 : (average / 5) * c;
  const max = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <section aria-labelledby="credibility-title" className={card}>
      <h2 id="credibility-title" className="text-navy font-bold">
        Mon indice de crédibilité
      </h2>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={average === null ? "Pas encore de note" : `Note moyenne ${average} sur 5`}
          >
            <g
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
            >
              <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" />
              {average !== null && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke="#2563EB"
                  strokeDasharray={`${filled} ${c - filled}`}
                />
              )}
            </g>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-navy text-2xl font-extrabold">{average === null ? "–" : average}</span>
            <span className="text-muted mt-2 text-xs">/5</span>
          </div>
        </div>
        <div>
          <p className="text-success font-bold">{credibilityLabel(average)}</p>
          <p className="text-muted mt-1 text-xs leading-relaxed">
            Vos recommandations témoignent de la qualité de votre travail et de votre professionnalisme.
          </p>
        </div>
      </div>
      <ul className="mt-5 space-y-2">
        {distribution.map(({ stars, count }) => (
          <li key={stars} className="flex items-center gap-2 text-xs">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
            <span className="text-navy w-14">
              {stars} étoile{stars > 1 ? "s" : ""}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-blue-100">
              <span
                className="bg-brand block h-full rounded-full"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </span>
            <span className="text-navy w-4 text-right font-semibold">{count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function KeywordCloud({ keywords }: { keywords: { name: string; count: number }[] }) {
  return (
    <section aria-labelledby="keywords-title" className={card}>
      <h2 id="keywords-title" className="text-navy font-bold">
        Mots-clés les plus cités
      </h2>
      {keywords.length === 0 ? (
        <p className="text-muted mt-3 text-sm">
          Les mots-clés choisis par vos recommandeurs apparaîtront ici.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {keywords.map((k) => (
            <li key={k.name} className="text-brand rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium">
              {k.name} ({k.count})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const WHO = [
  { icon: UserCheck, label: "Anciens et actuels managers" },
  { icon: Users, label: "Collègues de travail" },
  { icon: Handshake, label: "Clients et partenaires" },
  { icon: Briefcase, label: "Membres d'équipe de projet" },
  { icon: GraduationCap, label: "Formateurs et mentors" },
  { icon: Network, label: "Autres contacts professionnels" },
];

export function WhoCanRecommend() {
  return (
    <section aria-labelledby="who-title" className={card}>
      <h2 id="who-title" className="text-navy font-bold">
        Qui peut me recommander ?
      </h2>
      <ul className="mt-4 space-y-3">
        {WHO.map(({ icon: Icon, label }) => (
          <li key={label} className="text-navy flex items-center gap-3 text-sm">
            <Icon className="text-brand size-5 shrink-0" aria-hidden /> {label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NetworkPromo() {
  return (
    <section className="from-navy to-brand shadow-lift rounded-2xl bg-gradient-to-br p-5 text-white">
      <div className="flex items-start gap-3">
        <Network className="size-9 shrink-0 text-amber-300" aria-hidden />
        <div>
          <h2 className="text-lg leading-snug font-bold">Élargissez votre réseau</h2>
          <p className="mt-2 text-sm text-white/80">
            Plus vous collaborez, plus vous obtenez de recommandations.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/opportunities"
        className="text-navy mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold hover:bg-blue-50"
      >
        Découvrir des opportunités <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
