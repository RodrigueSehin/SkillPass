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

const SERIES_COLORS = ["#8B5CF6", "#2563EB", "#F59E0B", "#10B981", "#EC4899"];
export const seriesColor = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length]!;

/** Lines over a few labelled steps, drawn as one SVG: no chart library for four short series. */
export function LineChart({
  labels,
  series,
  label,
}: {
  labels: string[];
  series: { name: string; values: number[] }[];
  label: string;
}) {
  const width = 360;
  const height = 150;
  const pad = { top: 8, right: 8, bottom: 22, left: 28 };
  const peak = Math.max(1, ...series.flatMap((s) => s.values));
  const top = peak <= 4 ? peak : Math.ceil(peak / 4) * 4;
  const x = (i: number) =>
    pad.left + (labels.length <= 1 ? 0 : (i / (labels.length - 1)) * (width - pad.left - pad.right));
  const y = (v: number) => pad.top + (1 - v / top) * (height - pad.top - pad.bottom);
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((top / 4) * i * 10) / 10);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="w-full">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#E2E8F0" strokeWidth="1" />
          <text x={pad.left - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#64748B">
            {t}
          </text>
        </g>
      ))}
      {labels.map((l, i) => (
        <text key={`${l}-${i}`} x={x(i)} y={height - 6} textAnchor="middle" fontSize="9" fill="#64748B">
          {l}
        </text>
      ))}
      {series.map((s, si) => (
        <polyline
          key={s.name}
          fill="none"
          stroke={seriesColor(si)}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
        />
      ))}
      {series.map((s, si) =>
        s.values.map((v, i) => (
          <circle key={`${s.name}-${i}`} cx={x(i)} cy={y(v)} r="2.5" fill={seriesColor(si)} />
        )),
      )}
    </svg>
  );
}

/** Bars for one series with a line over them for another: created versus evaluated, month after month. */
export function ComboChart({
  labels,
  bars,
  line,
  label,
}: {
  labels: string[];
  bars: number[];
  line: number[];
  label: string;
}) {
  const width = 460;
  const height = 190;
  const pad = { top: 10, right: 10, bottom: 24, left: 30 };
  const peak = Math.max(1, ...bars, ...line);
  const top = peak <= 4 ? 4 : Math.ceil(peak / 4) * 4;
  const inner = width - pad.left - pad.right;
  const step = inner / Math.max(labels.length, 1);
  const x = (i: number) => pad.left + step * i + step / 2;
  const y = (v: number) => pad.top + (1 - v / top) * (height - pad.top - pad.bottom);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="w-full">
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (top / 4) * i;
        return (
          <g key={i}>
            <line x1={pad.left} x2={width - pad.right} y1={y(v)} y2={y(v)} stroke="#E2E8F0" />
            <text x={pad.left - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#64748B">
              {Math.round(v * 10) / 10}
            </text>
          </g>
        );
      })}
      {bars.map((v, i) => (
        <rect
          key={`b-${i}`}
          x={x(i) - step * 0.28}
          y={y(v)}
          width={step * 0.56}
          height={Math.max(y(0) - y(v), 0)}
          rx="3"
          fill="#BFDBFE"
        />
      ))}
      <polyline
        fill="none"
        stroke="#16A34A"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={line.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
      />
      {line.map((v, i) => (
        <circle key={`l-${i}`} cx={x(i)} cy={y(v)} r="3" fill="#16A34A" />
      ))}
      {labels.map((l, i) => (
        <text key={`t-${i}`} x={x(i)} y={height - 7} textAnchor="middle" fontSize="9" fill="#64748B">
          {l}
        </text>
      ))}
    </svg>
  );
}

/** Vertical bars on a 0–100 scale, each with its value above and its own colour. */
export function RateBars({
  items,
  label,
}: {
  items: { label: string; value: number | null }[];
  label: string;
}) {
  const width = 360;
  const height = 190;
  const pad = { top: 18, right: 8, bottom: 24, left: 28 };
  const inner = width - pad.left - pad.right;
  const step = inner / Math.max(items.length, 1);
  const y = (v: number) => pad.top + (1 - v / 100) * (height - pad.top - pad.bottom);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="w-full">
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={pad.left} x2={width - pad.right} y1={y(v)} y2={y(v)} stroke="#E2E8F0" />
          <text x={pad.left - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#64748B">
            {v}
          </text>
        </g>
      ))}
      {items.map((it, i) => {
        const cx = pad.left + step * i + step / 2;
        const h = it.value === null ? 0 : y(0) - y(it.value);
        return (
          <g key={it.label}>
            {it.value !== null && (
              <rect
                x={cx - step * 0.3}
                y={y(it.value)}
                width={step * 0.6}
                height={Math.max(h, 0)}
                rx="3"
                fill={seriesColor(i)}
              />
            )}
            <text
              x={cx}
              y={it.value === null ? y(0) - 4 : y(it.value) - 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#0F172A"
            >
              {it.value === null ? "—" : `${it.value}%`}
            </text>
            <text x={cx} y={height - 7} textAnchor="middle" fontSize="9" fill="#64748B">
              {it.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
