import { ShieldCheck, BadgeCheck, QrCode } from "lucide-react";
import { Logo } from "@/components/layout/logo";

const POINTS = [
  { icon: BadgeCheck, text: "Des compétences prouvées, pas seulement déclarées" },
  { icon: QrCode, text: "Un passeport partageable par lien et QR code" },
  { icon: ShieldCheck, text: "Des credentials vérifiables par les recruteurs" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="[&_a]:text-white [&_span:first-child]:bg-white/10">
          <Logo />
        </div>
        <div className="relative z-10 max-w-md space-y-8">
          <h2 className="text-4xl font-bold leading-tight">Prove your skills. Own your future.</h2>
          <ul className="space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-blue-100">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div aria-hidden className="absolute -bottom-32 -right-32 size-96 rounded-full bg-brand/30 blur-3xl" />
        <p className="relative z-10 text-sm text-blue-200/70">© {new Date().getFullYear()} SkillPass</p>
      </aside>
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
