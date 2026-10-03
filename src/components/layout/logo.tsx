import Image from "next/image";
import Link from "next/link";
import emblemOnDark from "@/assets/brand/emblem-on-dark.png";
import emblemOnLight from "@/assets/brand/emblem-on-light.png";
import logoOnDark from "@/assets/auth/logo-on-dark.png";
import logoOnLight from "@/assets/auth/logo-on-light.png";
import { cn } from "@/lib/utils/cn";

type Tone = "dark" | "light";

/**
 * The hexagonal emblem on its own. `tone` follows the Logo convention:
 * "dark" = dark artwork for light backgrounds, "light" = white artwork for dark backgrounds.
 */
export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: Tone }) {
  return (
    <Image
      src={tone === "light" ? emblemOnDark : emblemOnLight}
      alt=""
      aria-hidden
      className={cn("h-9 w-auto", className)}
    />
  );
}

const HEIGHTS = { sm: "h-9", md: "h-11", lg: "h-16" } as const;

interface LogoProps {
  className?: string;
  href?: string;
  /** "light" is for dark backgrounds (sidebar, footer): the wordmark turns white. */
  tone?: Tone;
  size?: keyof typeof HEIGHTS;
  priority?: boolean;
}

/** Full SkillPass lockup (emblem, name and tagline), as delivered by the brand files. */
export function Logo({ className, href = "/", tone = "dark", size = "md", priority = false }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex shrink-0", className)} aria-label="SkillPass — accueil">
      <Image
        src={tone === "light" ? logoOnDark : logoOnLight}
        alt="SkillPass, le passeport numérique de vos compétences"
        priority={priority}
        className={cn("w-auto", HEIGHTS[size])}
      />
    </Link>
  );
}
