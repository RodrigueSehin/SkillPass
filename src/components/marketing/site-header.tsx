"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { NAV_LINKS, RESOURCE_LINKS } from "@/config/marketing";
import { cn } from "@/lib/utils/cn";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!resourcesOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!resourcesRef.current?.contains(e.target as Node)) setResourcesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setResourcesOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [resourcesOpen]);

  const closeAll = () => {
    setMobileOpen(false);
    setResourcesOpen(false);
  };

  return (
    <header className="border-border/70 sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6">
        <Logo tagline className="shrink-0" />

        <nav aria-label="Navigation du site" className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={index === 0 ? "page" : undefined}
              className={cn(
                "relative py-2 text-sm font-medium transition-colors",
                index === 0
                  ? "text-brand after:bg-brand after:absolute after:inset-x-0 after:-bottom-[25px] after:h-0.5 after:rounded-full"
                  : "text-foreground hover:text-brand",
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="relative" ref={resourcesRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={resourcesOpen}
              onClick={() => setResourcesOpen((o) => !o)}
              className="text-foreground hover:text-brand flex items-center gap-1 py-2 text-sm font-medium transition-colors"
            >
              Ressources
              <ChevronDown
                className={cn("size-4 transition-transform", resourcesOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {resourcesOpen && (
              <div
                role="menu"
                className="border-border shadow-lift absolute top-full left-1/2 mt-3 w-64 -translate-x-1/2 rounded-2xl border bg-white p-2"
              >
                {RESOURCE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    onClick={closeAll}
                    className="text-foreground hover:text-brand block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blue-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="hidden rounded-full px-5 sm:inline-flex">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild size="sm" className="hidden rounded-full px-5 sm:inline-flex">
            <Link href="/register">
              Créer mon SkillPass <ArrowRight />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label="Menu mobile"
          className="border-border border-t bg-white px-4 py-4 lg:hidden"
        >
          <ul className="space-y-1">
            {[...NAV_LINKS, ...RESOURCE_LINKS].map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={closeAll}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-blue-50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/login" onClick={closeAll}>
                Se connecter
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/register" onClick={closeAll}>
                Créer mon SkillPass
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
