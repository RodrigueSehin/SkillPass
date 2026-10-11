"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ClipboardCheck, History, LayoutDashboard, UserCog, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ITEMS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/admin/entreprises", label: "Entreprises", icon: Building2 },
  { href: "/admin/utilisateurs", label: "Utilisateurs et rôles", icon: UserCog },
  { href: "/admin/journal", label: "Journal d'audit", icon: History },
  { href: "/admin/verifications", label: "Validations d'évaluations", icon: ClipboardCheck },
];

export function ConsoleNav({ pending }: { pending: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Console d'administration"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-2 lg:sticky lg:top-6"
    >
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold",
                  active ? "text-brand bg-blue-50" : "text-navy hover:bg-slate-50",
                )}
              >
                <Icon className="text-brand size-5 shrink-0" aria-hidden />
                <span className="flex-1">{label}</span>
                {href === "/admin/entreprises" && pending > 0 && (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                    {pending}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
