import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { NAV_LINKS, RESOURCE_LINKS } from "@/config/marketing";

export function SiteFooter() {
  return (
    <footer className="border-border bg-navy border-t text-blue-100">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" size="lg" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-blue-200">
            Le passeport numérique des compétences : prouvez ce que vous savez faire, ouvrez-vous des
            opportunités.
          </p>
        </div>

        <nav aria-label="Pied de page : site">
          <h2 className="text-sm font-semibold text-white">SkillPass</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Pied de page : ressources">
          <h2 className="text-sm font-semibold text-white">Ressources</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {RESOURCE_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Pied de page : compte">
          <h2 className="text-sm font-semibold text-white">Votre compte</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/login" className="hover:text-white">
                Se connecter
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white">
                Créer mon SkillPass
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-blue-300">
        © {new Date().getFullYear()} SkillPass. Tous droits réservés.
      </div>
    </footer>
  );
}
