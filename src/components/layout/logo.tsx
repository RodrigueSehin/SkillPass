import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("text-navy inline-flex items-center gap-2 font-bold", className)}>
      <span className="bg-navy text-accent flex size-9 items-center justify-center rounded-xl">
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      <span className="text-lg tracking-tight">SkillPass</span>
    </Link>
  );
}
