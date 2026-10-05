import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface KpiCardProps {
  href: string;
  label: string;
  value: number;
  icon: LucideIcon;
  /** Tailwind classes for the coloured icon tile. */
  tile: string;
}

/** Figure + label, the whole card links to the page that details it. */
export function KpiCard({ href, label, value, icon: Icon, tile }: KpiCardProps) {
  return (
    <Link
      href={href}
      className="group border-border/60 shadow-soft hover:shadow-lift relative flex min-w-0 flex-col items-start gap-3 rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
    >
      <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl sm:size-12", tile)}>
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="text-navy block text-3xl leading-none font-extrabold tracking-tight">{value}</span>
        <span className="text-muted mt-1.5 block truncate text-[13px]">{label}</span>
      </span>
      <ArrowRight
        className="text-brand absolute top-4 right-4 size-4 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
