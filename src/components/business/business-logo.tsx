import Image from "next/image";
import Link from "next/link";
import emblem from "@/assets/brand/emblem-on-dark.png";
import { cn } from "@/lib/utils/cn";

/** SkillPass Business lockup for dark backgrounds: emblem, wordmark and the orange "Business". */
export function BusinessLogo({ className, href = "/business" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label="SkillPass Business — tableau de bord"
      className={cn("inline-flex items-center gap-3", className)}
    >
      <Image src={emblem} alt="" aria-hidden priority className="h-11 w-auto" />
      <span className="leading-none">
        <span className="block text-[1.7rem] font-extrabold tracking-tight text-white">
          Skill<span className="text-orange">Pass</span>
        </span>
        <span className="text-accent mt-1 block text-lg font-bold tracking-tight">Business</span>
      </span>
    </Link>
  );
}
