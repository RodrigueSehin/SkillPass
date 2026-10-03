import { Progress } from "@/components/ui/progress";
import type { ScoreResult } from "@/lib/score";

/** Never show a bare number: every point is traced back to a criterion. */
export function ScoreBreakdown({ score }: { score: ScoreResult }) {
  return (
    <div>
      <p className="text-muted mb-4 text-sm">
        SkillPass Score <span className="text-foreground font-semibold">{score.total}/100</span>
      </p>
      <ul className="space-y-4">
        {score.criteria.map((c) => (
          <li key={c.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{c.label}</span>
              <span className="text-muted tabular-nums">
                <span className="text-foreground font-semibold">{c.points}</span>/{c.max}
              </span>
            </div>
            <Progress
              value={(c.points / c.max) * 100}
              className="mt-1.5 h-1.5"
              aria-label={`${c.label} : ${c.points} sur ${c.max}`}
            />
            <p className="text-muted mt-1 text-xs">{c.hint}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
