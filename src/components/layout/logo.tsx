import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** The "S" emblem: a blue stroke flowing into an amber one. Pure SVG, no assets. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={cn("size-9", className)}>
      <path
        d="M29 12.5C29 8.6 25 6 20 6c-5.2 0-9 2.6-9 7 0 4.2 4 5.7 9 7"
        stroke="#2563EB"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M20 20c5 1.3 9 2.8 9 7.2 0 4.4-3.8 6.8-9 6.8-4.7 0-8.2-2-8.8-5.8"
        stroke="#F59E0B"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  href?: string;
  /** "light" is for dark backgrounds (sidebar, auth panel). */
  tone?: "dark" | "light";
  /** Shows the tagline under the name (marketing header). */
  tagline?: boolean;
}

export function Logo({ className, href = "/", tone = "dark", tagline = false }: LogoProps) {
  const light = tone === "light";
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="SkillPass — accueil"
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={cn("text-xl font-bold tracking-tight", light ? "text-white" : "text-navy")}>
          Skill<span className={light ? "text-amber-400" : "text-brand"}>Pass</span>
        </span>
        {tagline && (
          <span className={cn("mt-1 text-[11px] font-medium", light ? "text-blue-200" : "text-muted")}>
            Prove your skills. Own your future.
          </span>
        )}
      </span>
    </Link>
  );
}
