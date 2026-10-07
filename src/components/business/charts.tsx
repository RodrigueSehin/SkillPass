import { cn } from "@/lib/utils/cn";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** Ring split into proportional arcs, with a number and a caption in the middle. Empty data draws a grey ring. */
export function Donut({
  segments,
  center,
  caption,
  label,
  size = 132,
}: {
  segments: DonutSegment[];
  center: React.ReactNode;
  caption: string;
  label: string;
  size?: number;
}) {
  const stroke = Math.round(size * 0.14);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((n, s) => n + s.value, 0);
  const arcs = segments
    .filter((s) => s.value > 0)
    .reduce<{ segment: DonutSegment; length: number; start: number }[]>((acc, segment) => {
      const start = acc.reduce((n, a) => n + a.length, 0);
      return [...acc, { segment, length: (segment.value / total) * c, start }];
    }, []);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={stroke}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" />
          {arcs.map(({ segment, length, start }) => (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={segment.color}
              strokeDasharray={`${Math.max(length - 1.5, 0)} ${c - Math.max(length - 1.5, 0)}`}
              strokeDashoffset={-start}
            />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
        <span className="text-navy text-2xl font-extrabold">{center}</span>
        <span className="text-muted text-[11px]">{caption}</span>
      </div>
    </div>
  );
}

/** Thin progress bar: green from `good`, amber below. */
export function RateBar({
  value,
  good = 75,
  className,
}: {
  value: number;
  good?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("block h-1.5 w-full overflow-hidden rounded-full bg-slate-200", className)}
      aria-hidden
    >
      <span
        className={cn("block h-full rounded-full", value >= good ? "bg-green-500" : "bg-amber-400")}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </span>
  );
}
