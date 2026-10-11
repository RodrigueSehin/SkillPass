"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Building2,
  ChevronDown,
  Crown,
  LogOut,
  MessageSquare,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { HeaderMenu } from "@/components/layout/header-menu";
import { BUSINESS_NAV, BUSINESS_SECONDARY_NAV, type BusinessNavItem } from "@/config/business-navigation";
import { businessHas } from "@/lib/plans/entitlements";
import type { PlanCode } from "@/types/business";
import { cn } from "@/lib/utils/cn";
import { BusinessLogo } from "./business-logo";
import { OrgLogo } from "./org-logo";

const isActive = (pathname: string, href: string) =>
  href === "/business" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

function NavLink({ item }: { item: BusinessNavItem }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-brand shadow-soft text-white" : "text-blue-100/80 hover:bg-white/10 hover:text-white",
      )}
    >
      <item.icon className="size-5" aria-hidden />
      {item.label}
    </Link>
  );
}

export function BusinessSidebar({ planName, plan }: { planName: string; plan: PlanCode }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-gradient-to-b from-[var(--sidebar-from,#0a1d4d)] to-[var(--sidebar-to,#0e2a6b)] p-4 lg:flex">
      <div className="px-2 py-3">
        <BusinessLogo />
      </div>
      <nav
        aria-label="Navigation principale"
        className="no-scrollbar mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto"
      >
        {BUSINESS_NAV.filter((item) => !item.feature || businessHas(plan, item.feature)).map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        <div aria-hidden className="my-3 border-t border-white/10" />
        {BUSINESS_SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
        <Crown className="text-accent size-7" aria-hidden />
        <h2 className="mt-2 font-bold">Plan {planName}</h2>
        <p className="mt-1 text-xs leading-relaxed text-blue-100/80">
          Utilisez tout le potentiel de SkillPass pour votre organisation.
        </p>
        <Link
          href="/business/abonnements"
          className="text-navy mt-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold hover:bg-blue-50"
        >
          Voir mon plan <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </aside>
  );
}

/** Top-bar search: opens the talent search with the query. Ctrl+K focuses it from anywhere. */
function BusinessSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      role="search"
      className="relative hidden max-w-2xl flex-1 sm:block"
      onSubmit={(e) => {
        e.preventDefault();
        const q = query.trim();
        router.push(q ? `/business/talents?q=${encodeURIComponent(q)}` : "/business/talents");
      }}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-[1.1rem] -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        ref={input}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Rechercher dans SkillPass Business"
        placeholder="Rechercher un talent, une compétence, une offre…"
        className="border-border shadow-soft h-11 w-full rounded-xl border bg-white pr-16 pl-11 text-sm placeholder:text-slate-400"
      />
      <kbd className="text-muted absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium">
        Ctrl K
      </kbd>
    </form>
  );
}

const itemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-slate-100";

export function BusinessTopbar({
  organizationName,
  roleLabel,
  logoVersion,
  pendingInvites,
  showLogo = true,
  showName = true,
  platformAdmin = false,
}: {
  organizationName: string;
  roleLabel: string;
  logoVersion: string | null;
  pendingInvites: number;
  /** Branding choices of the organization (Settings > Personalization). */
  showLogo?: boolean;
  showName?: boolean;
  /** The general administrator of SkillPass gets a link to the console. */
  platformAdmin?: boolean;
}) {
  return (
    <header className="border-border/70 sticky top-0 z-20 flex h-[4.5rem] items-center gap-3 border-b bg-white/85 px-4 backdrop-blur sm:px-6">
      <BusinessSearch />
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <HeaderMenu
          label="Notifications"
          triggerClassName="relative size-11 justify-center text-slate-600"
          trigger={
            <>
              <Bell className="size-5" aria-hidden />
              {pendingInvites > 0 && (
                <span aria-hidden className="absolute top-2.5 right-3 size-2 rounded-full bg-red-500" />
              )}
            </>
          }
        >
          <p className="text-muted px-3 py-4 text-sm">
            {pendingInvites > 0
              ? `${pendingInvites} invitation${pendingInvites > 1 ? "s" : ""} en attente de réponse.`
              : "Aucune notification pour l'instant."}
          </p>
        </HeaderMenu>
        <HeaderMenu
          label="Messages"
          triggerClassName="size-11 justify-center text-slate-600"
          trigger={<MessageSquare className="size-5" aria-hidden />}
        >
          <p className="text-muted px-3 py-4 text-sm">La messagerie avec les talents arrive prochainement.</p>
        </HeaderMenu>
        <span aria-hidden className="bg-border mx-1 hidden h-8 w-px sm:block" />
        <HeaderMenu
          label="Menu de l'organisation"
          panelRole="menu"
          panelClassName="w-60"
          triggerClassName="gap-3 py-1 pr-2 pl-1"
          trigger={
            <>
              {showLogo && (
                <OrgLogo name={organizationName} version={logoVersion} className="size-10 text-sm" />
              )}
              <span className="hidden text-left leading-tight md:block">
                {showName && (
                  <span className="text-foreground block text-sm font-semibold">{organizationName}</span>
                )}
                <span className="text-muted block text-xs">{roleLabel}</span>
              </span>
              <ChevronDown className="hidden size-4 text-slate-500 md:block" aria-hidden />
            </>
          }
        >
          <Link href="/business/organisation" role="menuitem" className={itemClass}>
            <Building2 className="size-4" aria-hidden /> Organisation
          </Link>
          <Link href="/dashboard" role="menuitem" className={itemClass}>
            <UserRound className="size-4" aria-hidden /> Mon espace Talent
          </Link>
          {platformAdmin && (
            <Link href="/admin" role="menuitem" className={itemClass}>
              <ShieldCheck className="size-4" aria-hidden /> Console SkillPass
            </Link>
          )}
          <form action={logoutAction} className="border-border mt-1 border-t pt-1">
            <button type="submit" role="menuitem" className={`${itemClass} text-danger`}>
              <LogOut className="size-4" aria-hidden /> Déconnexion
            </button>
          </form>
        </HeaderMenu>
      </div>
    </header>
  );
}

/** Bottom bar on phones: the four most used sections. */
export function BusinessMobileNav() {
  const pathname = usePathname();
  const items = [
    BUSINESS_NAV[0],
    BUSINESS_NAV[1],
    BUSINESS_NAV[2],
    BUSINESS_NAV[6],
    BUSINESS_SECONDARY_NAV[0],
  ];
  return (
    <nav
      aria-label="Navigation mobile"
      className="border-border fixed inset-x-0 bottom-0 z-30 flex border-t bg-white lg:hidden"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              active ? "text-brand" : "text-muted",
            )}
          >
            <item.icon className="size-5" aria-hidden />
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
