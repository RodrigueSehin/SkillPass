import { cn } from "@/lib/utils/cn";
import { SKILL_LEVELS, SKILL_LEVEL_LABELS, type SkillLevel } from "@/types/skill";

const COLORS: Record<SkillLevel, { stroke: string; dot: string }> = {
  EXPERT: { stroke: "#16A34A", dot: "bg-green-600" },
  ADVANCED: { stroke: "#063DB2", dot: "bg-brand" },
  INTERMEDIATE: { stroke: "#60A5FA", dot: "bg-blue-400" },
  BEGINNER: { stroke: "#CBD5E1", dot: "bg-slate-300" },
};

/** Donut of the user's skills by level. Pure SVG, so it renders on the server. */
export function LevelOverview({ levels, total }: { levels: Record<SkillLevel, number>; total: number }) {
  const size = 132;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const order = [...SKILL_LEVELS].reverse();
  const arcs = order
    .filter((level) => levels[level] > 0)
    .reduce<{ level: SkillLevel; len: number; start: number }[]>((acc, level) => {
      const len = (levels[level] / total) * c;
      const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].len : 0;
      return [...acc, { level, len, start }];
    }, []);

  return (
    <section
      aria-labelledby="levels-title"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
    >
      <h2 id="levels-title" className="text-navy font-bold">
        Aperçu de mes compétences
      </h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            role="img"
            aria-label={`${total} compétences par niveau`}
          >
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
            {arcs.map(({ level, len, start }) => (
              <circle
                key={level}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={COLORS[level].stroke}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-start}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-navy text-3xl leading-none font-extrabold">{total}</span>
            <span className="text-muted text-xs">Compétences</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {order.map((level) => (
            <li key={level} className="flex items-center gap-2">
              <span className={cn("size-2.5 shrink-0 rounded-full", COLORS[level].dot)} aria-hidden />
              <span className="text-navy flex-1 truncate">{SKILL_LEVEL_LABELS[level]}</span>
              <span className="text-navy font-bold">{levels[level]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
