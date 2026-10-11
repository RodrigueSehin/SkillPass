import { AVATAR_PRESETS, avatarSrc, type AvatarRef } from "@/lib/avatars";
import { cn } from "@/lib/utils/cn";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

const TONES = [
  "bg-blue-100 text-brand",
  "bg-orange-100 text-orange-600",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
];
const toneOf = (key: string) => TONES[[...key].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]!;

/** The white drawing of each SkillPass avatar, on a 64 x 64 canvas. */
function Shape({ name }: { name: string }) {
  const fill = { fill: "rgba(255,255,255,0.92)" };
  const line = {
    fill: "none",
    stroke: "rgba(255,255,255,0.92)",
    strokeWidth: 3.5,
    strokeLinecap: "round" as const,
  };
  switch (name) {
    case "orbit":
      return (
        <>
          <circle cx="32" cy="32" r="9" {...fill} />
          <circle cx="32" cy="32" r="20" {...line} opacity="0.7" />
          <circle cx="50" cy="22" r="4" {...fill} />
        </>
      );
    case "peaks":
      return (
        <>
          <path d="M8 50 L26 20 L38 40 L46 28 L58 50 Z" {...fill} />
          <circle cx="46" cy="16" r="5" {...fill} opacity="0.75" />
        </>
      );
    case "hex":
      return (
        <>
          <path d="M32 10 L51 21 L51 43 L32 54 L13 43 L13 21 Z" {...line} />
          <path d="M32 24 L42 30 L42 38 L32 44 L22 38 L22 30 Z" {...fill} />
        </>
      );
    case "wave":
      return (
        <>
          <path d="M8 26 Q20 14 32 26 T56 26" {...line} />
          <path d="M8 40 Q20 28 32 40 T56 40" {...line} opacity="0.7" />
        </>
      );
    case "spark":
      return <path d="M32 8 L38 26 L56 32 L38 38 L32 56 L26 38 L8 32 L26 26 Z" {...fill} />;
    case "grid":
      return (
        <>
          {[18, 32, 46].flatMap((x) =>
            [18, 32, 46].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" {...fill} />),
          )}
        </>
      );
    case "shield":
      return (
        <>
          <path d="M32 9 L50 16 L50 32 Q50 46 32 55 Q14 46 14 32 L14 16 Z" {...fill} />
          <path
            d="M23 32 L30 39 L42 26"
            fill="none"
            stroke="rgba(6,95,70,0.9)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );
    case "arc":
      return (
        <>
          <path d="M14 44 A20 20 0 0 1 50 44" {...line} />
          <circle cx="32" cy="38" r="6" {...fill} />
        </>
      );
    case "bolt":
      return <path d="M36 8 L16 36 L30 36 L26 56 L48 26 L33 26 Z" {...fill} />;
    case "leaf":
      return (
        <>
          <path d="M14 50 Q14 14 50 14 Q50 50 14 50 Z" {...fill} />
          <path
            d="M20 44 L40 24"
            fill="none"
            stroke="rgba(21,128,61,0.8)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      );
    case "diamond":
      return (
        <>
          <path d="M32 8 L54 32 L32 56 L10 32 Z" {...fill} opacity="0.85" />
          <path d="M32 18 L44 32 L32 46 L20 32 Z" fill="rgba(29,78,216,0.55)" />
        </>
      );
    case "chip":
      return (
        <>
          <rect x="18" y="18" width="28" height="28" rx="5" {...fill} />
          <rect x="26" y="26" width="12" height="12" rx="2" fill="rgba(15,23,42,0.6)" />
          {[24, 32, 40].map((p) => (
            <g key={p}>
              <path d={`M${p} 10 V16 M${p} 48 V54 M10 ${p} H16 M48 ${p} H54`} {...line} strokeWidth={2.5} />
            </g>
          ))}
        </>
      );
    default:
      return null;
  }
}

/** One of the SkillPass avatars, drawn inline: no file, no request. */
export function PresetAvatar({ presetKey, className }: { presetKey: string; className?: string }) {
  const preset = AVATAR_PRESETS.find((p) => p.key === presetKey) ?? AVATAR_PRESETS[0]!;
  const gradient = `sp-avatar-${preset.key}`;
  return (
    <svg viewBox="0 0 64 64" className={cn("size-full", className)} aria-hidden>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={preset.from} />
          <stop offset="1" stopColor={preset.to} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#${gradient})`} />
      <Shape name={preset.key} />
    </svg>
  );
}

/**
 * The picture of a person: their photo, a SkillPass avatar, or their initials on a colour picked from the
 * name. `className` sets the size and the text size of the initials.
 */
export function ProfileAvatar({
  name,
  profileId,
  avatar,
  className,
}: {
  name: string;
  profileId?: string;
  avatar?: AvatarRef | null;
  className?: string;
}) {
  const base = "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold";
  if (avatar?.kind === "preset") {
    return (
      <span aria-hidden className={cn(base, className ?? "size-16")}>
        <PresetAvatar presetKey={avatar.key} />
      </span>
    );
  }
  if (avatar?.kind === "upload" && profileId) {
    return (
      <span aria-hidden className={cn(base, "bg-slate-100", className ?? "size-16")}>
        {/* A private, versioned address: next/image would only add a second optimisation step. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarSrc(profileId, avatar)} alt="" className="size-full object-cover" loading="lazy" />
      </span>
    );
  }
  return (
    <span aria-hidden className={cn(base, toneOf(name), className ?? "size-16 text-xl")}>
      {initialsOf(name)}
    </span>
  );
}
