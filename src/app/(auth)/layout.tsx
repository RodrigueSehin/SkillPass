import Image from "next/image";
import Link from "next/link";
import logoOnLight from "@/assets/auth/logo-on-light.png";
import { AuthBanner, AuthShowcase } from "@/components/auth/auth-showcase";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AuthBanner />
      <div className="grid flex-1 lg:grid-cols-[1.55fr_1fr]">
        <AuthShowcase />
        <div className="flex items-center justify-center px-4 py-8 sm:px-8 lg:py-10">{children}</div>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="SkillPass — accueil" className="shrink-0">
              <Image src={logoOnLight} alt="SkillPass" className="h-9 w-auto" />
            </Link>
            <p className="hidden sm:block">Le passeport numérique qui prouve vos compétences.</p>
          </div>
          <p>© {new Date().getFullYear()} SkillPass. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
