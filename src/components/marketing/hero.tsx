import Link from "next/link";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HERO_STATS } from "@/config/marketing";
import { CountUp } from "./count-up";
import { HeroVisual } from "./hero-visual";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/40 to-white">
      <div
        aria-hidden
        className="absolute -top-40 -right-40 size-[38rem] rounded-full bg-blue-100/50 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-4 pt-12 pb-32 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:pt-16 lg:pb-40">
        <div>
          <p
            className="text-navy animate-fade-up inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium"
            style={{ animationDelay: "0ms" }}
          >
            <ShieldCheck className="text-brand size-4" aria-hidden /> Le passeport numérique des compétences
          </p>

          <h1
            className="text-navy animate-fade-up mt-7 text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl lg:text-[3rem] xl:text-[3.1rem]"
            style={{ animationDelay: "120ms" }}
          >
            Prouvez vos compétences.
            <span className="mt-1 block">
              <span className="text-brand">Construisez</span>{" "}
              <span className="text-accent">votre avenir.</span>
            </span>
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
            style={{ animationDelay: "240ms" }}
          >
            SkillPass transforme vos compétences, expériences et réalisations en un passeport professionnel
            vérifiable. Pour les talents, les entreprises, les organismes de formation et plus encore.
          </p>

          <div className="animate-fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "360ms" }}>
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/register">
                Créer mon SkillPass <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-brand/40 text-navy rounded-full px-8"
            >
              <Link href="/#entreprises">
                <Users /> Explorer les talents
              </Link>
            </Button>
          </div>

          <dl
            className="animate-fade-up mt-10 grid grid-cols-3 sm:mt-12 sm:flex"
            style={{ animationDelay: "480ms" }}
          >
            {HERO_STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={i > 0 ? "border-border border-l pl-4 sm:pr-8 sm:pl-8" : "pr-4 sm:pr-8"}
              >
                <dd className="text-navy text-2xl font-bold tracking-tight sm:text-3xl">
                  <CountUp value={stat.value} />
                </dd>
                <dt className="text-muted mt-1 text-sm">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
