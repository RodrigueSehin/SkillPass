import Link from "next/link";
import { BadgeCheck, MapPin, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Availability } from "@/types/profile";
import type { TalentHit } from "@/types/talent";

const initials = (name: string) =>
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

export function TalentAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        toneOf(name),
        className ?? "size-16 text-xl",
      )}
    >
      {initials(name)}
    </span>
  );
}

export const AVAILABILITY_SHORT: Record<Availability, { label: string; tone: string }> = {
  IMMEDIATE: { label: "Disponible maintenant", tone: "bg-green-500" },
  ONE_MONTH: { label: "Sous 1 mois", tone: "bg-amber-500" },
  THREE_MONTHS: { label: "Sous 3 mois", tone: "bg-amber-500" },
  NOT_AVAILABLE: { label: "Non disponible", tone: "bg-slate-400" },
};

export function TalentCard({
  hit,
  selected,
  href,
  highlightSkills,
}: {
  hit: TalentHit;
  selected: boolean;
  href: string;
  highlightSkills: string[];
}) {
  const { record: t, match } = hit;
  const wanted = new Set(highlightSkills.map((s) => s.toLowerCase()));
  const skills = [...t.skills].sort(
    (a, b) =>
      Number(wanted.has(b.name.toLowerCase())) - Number(wanted.has(a.name.toLowerCase())) ||
      b.score - a.score,
  );
  const verified = t.skills.some((s) => s.verified);
  const availability = AVAILABILITY_SHORT[t.availability];
  return (
    <li>
      <article
        className={cn(
          "border-border/70 shadow-soft flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4 sm:flex-nowrap",
          selected && "border-brand ring-brand/20 ring-2",
        )}
      >
        <TalentAvatar name={t.fullName} />
        <div className="min-w-0 flex-1">
          <h3 className="text-navy flex items-center gap-1.5 text-lg font-bold">
            <span className="truncate">{t.fullName}</span>
            {verified && (
              <BadgeCheck className="text-brand size-5 shrink-0" aria-label="Compétences vérifiées" />
            )}
          </h3>
          <p className="text-navy/85 truncate text-sm">{t.profession ?? t.headline ?? "—"}</p>
          <p className="text-muted mt-1 flex flex-wrap gap-x-4 text-sm">
            {t.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden /> {t.location.split(",")[0]}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Briefcase className="size-3.5" aria-hidden /> {t.yearsOfExperience} an
              {t.yearsOfExperience > 1 ? "s" : ""} d&apos;expérience
            </span>
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {skills.slice(0, 5).map((s) => (
              <li
                key={s.name}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium",
                  wanted.has(s.name.toLowerCase()) ? "text-brand bg-blue-50" : "bg-slate-100 text-slate-600",
                )}
              >
                {s.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex w-full shrink-0 items-center justify-between gap-4 sm:w-auto sm:flex-col sm:items-end">
          {match !== null && (
            <p className="text-center">
              <span className="text-brand block text-2xl leading-none font-bold">{match}%</span>
              <span className="text-muted text-xs">Match</span>
            </p>
          )}
          <p className="text-navy flex items-center gap-1.5 text-xs">
            <span className={cn("size-2 rounded-full", availability.tone)} aria-hidden /> {availability.label}
          </p>
          <Link
            href={href}
            scroll={false}
            className={cn(
              "flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold",
              selected
                ? "bg-brand text-white"
                : "border-brand/40 text-brand border bg-white hover:bg-blue-50",
            )}
          >
            Voir profil →
          </Link>
        </div>
      </article>
    </li>
  );
}
