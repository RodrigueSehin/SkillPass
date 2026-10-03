import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SkillPassScoreProps {
  score: number;
  max?: number;
  verified?: boolean;
  size?: number;
  className?: string;
}

/** Circular score gauge. Pure SVG so it renders on the server with no JS. */
export function SkillPassScore({
  score,
  max = 100,
  verified = false,
  size = 160,
  className,
}: SkillPassScoreProps) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(Math.max(score / max, 0), 1);

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="img"
        aria-label={`Score SkillPass : ${score} sur ${max}`}
      >
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="skillpass-score-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#skillpass-score-gradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tracking-tight text-navy">{score}</span>
          <span className="text-xs font-medium text-muted">/{max}</span>
        </div>
      </div>
      {verified && (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-success">
          <BadgeCheck className="size-4" aria-hidden /> Vérifié
        </span>
      )}
    </div>
  );
}
