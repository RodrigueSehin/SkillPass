import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="border-border bg-surface border-t">
      <div className="text-muted mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6">
        <Logo />
        <nav aria-label="Pied de page" className="flex gap-6">
          <Link href="/login" className="hover:text-foreground">
            Connexion
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Inscription
          </Link>
          <a href="#tarifs" className="hover:text-foreground">
            Tarifs
          </a>
        </nav>
        <p>© {new Date().getFullYear()} SkillPass. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
