import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

const LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment", label: "Comment ça marche" },
  { href: "#entreprises", label: "Entreprises" },
  { href: "#tarifs", label: "Tarifs" },
];

export function SiteHeader() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav aria-label="Navigation du site" className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-muted hover:text-foreground text-sm font-medium transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Connexion</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Créer mon SkillPass</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
