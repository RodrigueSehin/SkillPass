import { Reveal } from "./reveal";
import { Building2, FileText, GraduationCap, Settings, ShieldCheck, UserRound } from "lucide-react";

const ITEMS = [
  { icon: UserRound, title: "Profil professionnel", text: "Créez votre identité numérique" },
  { icon: Settings, title: "Compétences vérifiées", text: "Démontrez ce que vous savez faire" },
  { icon: ShieldCheck, title: "Certifications", text: "Validez vos acquis" },
  { icon: FileText, title: "Portfolio & projets", text: "Montrez vos réalisations" },
  { icon: Building2, title: "Opportunités", text: "Trouvez le bon emploi" },
  { icon: GraduationCap, title: "Formation & évolution", text: "Progressez avec SkillPass" },
] as const;

/** White card overlapping the bottom of the hero. */
export function FeatureStrip() {
  return (
    <section aria-label="Les atouts de SkillPass" className="relative z-10 -mt-20 px-4 sm:px-6 lg:-mt-24">
      <ul className="shadow-lift mx-auto grid max-w-[1400px] grid-cols-2 gap-x-2 gap-y-6 rounded-3xl bg-white p-6 sm:grid-cols-3 lg:grid-cols-6 lg:gap-y-0 lg:p-8">
        {ITEMS.map(({ icon: Icon, title, text }, i) => (
          <Reveal
            as="li"
            key={title}
            delay={i * 80}
            className={`flex flex-col items-start gap-3 px-3 lg:px-5 ${i > 0 ? "lg:border-border lg:border-l" : ""}`}
          >
            <span className="text-brand flex size-12 items-center justify-center rounded-full bg-blue-50">
              <Icon className="size-6" aria-hidden />
            </span>
            <div>
              <h3 className="text-navy text-sm font-bold">{title}</h3>
              <p className="text-muted mt-1 text-xs leading-snug">{text}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
