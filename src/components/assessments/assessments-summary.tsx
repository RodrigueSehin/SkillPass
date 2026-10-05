import Link from "next/link";
import { BadgeCheck, CheckCircle2, ClipboardCheck, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AssessmentSummary } from "@/services/assessment.service";
import { SKILL_LEVEL_LABELS } from "@/types/skill";
import type { CredentialDTO } from "@/types/verification";
import { skillVisual } from "@/config/skill-visuals";

const pct = (n: number, total: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : "—");

/** Four figures: attempts done, passed, running, failed. Percentages are shares of all attempts. */
export function AssessmentKpis({ summary }: { summary: AssessmentSummary }) {
  const total = summary.finished + summary.inProgress;
  const items = [
    ["Évaluations passées", summary.finished, ClipboardCheck, "bg-blue-50 text-brand", null],
    ["Réussies", summary.passed, CheckCircle2, "bg-green-50 text-success", pct(summary.passed, total)],
    ["En cours", summary.inProgress, Clock, "bg-blue-50 text-brand", pct(summary.inProgress, total)],
    ["Échouées", summary.failed, XCircle, "bg-red-50 text-danger", pct(summary.failed, total)],
  ] as const;
  return (
    <section aria-label="Indicateurs" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map(([label, value, Icon, tile, share]) => (
        <div
          key={label}
          className="border-border/60 shadow-soft flex min-w-0 items-center gap-3 rounded-2xl border bg-white p-4"
        >
          <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", tile)}>
            <Icon className="size-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-navy block text-2xl leading-none font-extrabold">{value}</span>
            <span className="text-muted mt-1 block truncate text-xs">{label}</span>
          </span>
          {share && <span className="text-muted self-start text-xs">{share}</span>}
        </div>
      ))}
    </section>
  );
}

/** Average of the scored attempts as a donut, with the three outcome counts below. */
export function ScoreSummary({ summary }: { summary: AssessmentSummary }) {
  const size = 120;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const score = summary.averageScore;
  const message =
    score === null
      ? "Passez une première évaluation pour voir votre score."
      : score >= 75
        ? "Excellent niveau ! Continuez ainsi."
        : score >= 50
          ? "Bon niveau. Continuez à passer des évaluations pour renforcer votre profil."
          : "Une marge de progression : relisez les corrections et réessayez.";
  return (
    <section
      aria-labelledby="avg-title"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
    >
      <h2 id="avg-title" className="text-navy font-bold">
        Mon score moyen
      </h2>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            role="img"
            aria-label={score === null ? "Aucun score" : `Score moyen : ${score} sur 100`}
          >
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
            {score !== null && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="#16A34A"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - score / 100)}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-navy text-3xl leading-none font-extrabold">{score ?? "—"}</span>
            <span className="text-muted text-xs">/100</span>
          </div>
        </div>
        <p className="text-muted text-sm leading-snug">{message}</p>
      </div>
      <ul className="border-border/60 mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center text-xs">
        <li>
          <span className="text-navy block text-lg font-bold">{summary.passed}</span>
          <span className="text-muted">Réussies</span>
        </li>
        <li>
          <span className="text-navy block text-lg font-bold">
            {summary.inProgress + summary.pendingReview}
          </span>
          <span className="text-muted">En cours</span>
        </li>
        <li>
          <span className="text-navy block text-lg font-bold">{summary.failed}</span>
          <span className="text-muted">Échouées</span>
        </li>
      </ul>
    </section>
  );
}

export function RecentBadges({ credentials }: { credentials: CredentialDTO[] }) {
  return (
    <section
      aria-labelledby="recent-badges"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="recent-badges" className="text-navy font-bold">
          Badges récents
        </h2>
        <Link href="/dashboard/badges" className="text-brand text-sm font-semibold hover:underline">
          Voir tous
        </Link>
      </div>
      {credentials.length === 0 ? (
        <p className="text-muted mt-3 flex items-center gap-2 text-sm">
          <BadgeCheck className="size-4" aria-hidden /> Réussissez une évaluation pour obtenir un badge.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {credentials.slice(0, 3).map((c) => {
            const { icon: Icon, tile } = skillVisual(c.skillName);
            return (
              <li key={c.credentialId}>
                <Link
                  href={`/verify/${c.credentialId}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-2 text-center hover:bg-slate-50"
                >
                  <span className={cn("flex size-12 items-center justify-center rounded-2xl", tile)}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="text-navy text-xs leading-tight font-semibold">{c.skillName}</span>
                  <span className="text-muted text-[11px]">{SKILL_LEVEL_LABELS[c.level]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
