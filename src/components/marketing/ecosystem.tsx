import Link from "next/link";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, ChevronRight, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: UserRound,
    title: "Créez votre profil",
    text: "Renseignez vos informations, vos compétences et vos expériences.",
  },
  {
    icon: BadgeCheck,
    title: "Validez vos compétences",
    text: "Ajoutez des preuves, passez des évaluations et obtenez des badges.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Accédez aux opportunités",
    text: "Soyez visible auprès des recruteurs et trouvez l'emploi qui vous correspond.",
  },
] as const;

export function Ecosystem() {
  return (
    <section id="ecosysteme" className="scroll-mt-24 py-20">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.5fr]">
        <div>
          <p className="text-brand flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden className="bg-accent h-0.5 w-6 rounded-full" /> Un écosystème complet
          </p>
          <h2 className="text-navy mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            De vos compétences
            <br />
            aux opportunités
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            SkillPass vous accompagne à chaque étape de votre parcours professionnel. Développez vos
            compétences, obtenez des preuves, faites-vous évaluer et accédez aux meilleures opportunités.
          </p>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link href="/#fonctionnalites">
              Découvrir comment ça marche <ArrowRight />
            </Link>
          </Button>
        </div>

        <ol className="grid items-stretch gap-6 pt-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {STEPS.flatMap(({ icon: Icon, title, text }, i) => {
            const card = (
              <li
                key={title}
                className="shadow-soft relative rounded-2xl bg-white px-5 pt-9 pb-6 text-center"
              >
                <span className="bg-brand absolute -top-4 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full text-sm font-bold text-white ring-4 ring-white">
                  {i + 1}
                </span>
                <span className="text-brand mx-auto flex size-14 items-center justify-center rounded-full bg-blue-50">
                  <Icon className="size-7" aria-hidden />
                </span>
                <h3 className="text-navy mt-4 font-bold">{title}</h3>
                <p className="text-muted mt-2 text-sm leading-relaxed">{text}</p>
              </li>
            );
            return i < STEPS.length - 1
              ? [
                  card,
                  <li key={`arrow-${i}`} aria-hidden className="hidden items-center md:flex">
                    <ChevronRight className="text-brand size-5" />
                  </li>,
                ]
              : [card];
          })}
        </ol>
      </div>
    </section>
  );
}
