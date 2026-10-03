import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "login", label: "Connexion", href: "/login" },
  { key: "register", label: "Créer un compte", href: "/register" },
] as const;

interface AuthCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Shows the Connexion / Créer un compte tabs, with the given one active. */
  tab?: (typeof TABS)[number]["key"];
  children: React.ReactNode;
}

/** White card on the right of every auth page. */
export function AuthCard({ title, subtitle, tab, children }: AuthCardProps) {
  return (
    <div className="shadow-lift w-full max-w-[34rem] rounded-3xl bg-white p-6 sm:p-10">
      <h1 className="text-navy text-center text-3xl font-extrabold tracking-tight sm:text-[2rem]">{title}</h1>
      {subtitle && <p className="mt-2 text-center text-slate-600">{subtitle}</p>}

      {tab && (
        <nav
          aria-label="Connexion ou inscription"
          className="mt-7 grid grid-cols-2 border-b border-slate-200"
        >
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              aria-current={t.key === tab ? "page" : undefined}
              className={cn(
                "-mb-px border-b-[3px] py-3 text-center text-sm font-semibold transition-colors",
                t.key === tab
                  ? "text-navy border-orange-500"
                  : "hover:text-navy border-transparent text-slate-500",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      )}

      <div className={tab ? "mt-7" : "mt-8"}>{children}</div>
    </div>
  );
}

/** Wordmark used in card titles: "Skill" in navy, "Pass" in orange. */
export function Wordmark() {
  return (
    <>
      Skill<span className="text-orange-500">Pass</span>
    </>
  );
}
