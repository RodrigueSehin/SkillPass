import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, Globe2, Layers, Target } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AddExperienceButton } from "./experience-editor";

export function AddExperiencePanel() {
  return (
    <section className="border-border/60 shadow-soft rounded-2xl border bg-white p-5">
      <h2 className="text-navy flex items-center gap-2.5 text-lg font-bold">
        <span className="bg-brand flex size-8 items-center justify-center rounded-full text-lg leading-none text-white">
          +
        </span>
        Ajouter une expérience
      </h2>
      <p className="text-muted mt-2 text-sm">
        Renseignez une nouvelle expérience pour enrichir votre profil.
      </p>
      <AddExperienceButton className="mt-4 w-full" />
    </section>
  );
}

interface Figures {
  years: number;
  companies: number;
  countries: number;
  domains: number;
}

export function CareerFigures({ figures }: { figures: Figures }) {
  const rows = [
    {
      icon: CalendarClock,
      value: figures.years,
      label: "d'expérience totale",
      unit: figures.years > 1 ? "ans" : "an",
      tone: "bg-blue-100 text-brand",
    },
    {
      icon: Building2,
      value: figures.companies,
      label: figures.companies > 1 ? "Entreprises" : "Entreprise",
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      icon: Globe2,
      value: figures.countries,
      label: figures.countries > 1 ? "Pays" : "Pays",
      tone: "bg-sky-100 text-sky-700",
    },
    {
      icon: Layers,
      value: figures.domains,
      label: `Domaine${figures.domains > 1 ? "s" : ""} d'expertise`,
      tone: "bg-indigo-100 text-indigo-700",
    },
  ];
  return (
    <section
      aria-labelledby="figures-title"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
    >
      <h2 id="figures-title" className="text-navy font-bold">
        Mon parcours en chiffres
      </h2>
      <ul className="mt-4 space-y-4">
        {rows.map(({ icon: Icon, value, label, unit, tone }) => (
          <li key={label} className="flex items-center gap-4">
            <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", tone)}>
              <Icon className="size-6" aria-hidden />
            </span>
            <p>
              <span className="text-navy text-xl font-bold">
                {value}
                {unit && ` ${unit}`}
              </span>
              <span className="text-muted block text-sm">{label}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TopSkills({ skills }: { skills: { name: string; score: number }[] }) {
  return (
    <section
      aria-labelledby="top-skills-title"
      className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
    >
      <h2 id="top-skills-title" className="text-navy font-bold">
        Mes top compétences <span className="text-muted text-xs font-normal">(liées aux expériences)</span>
      </h2>
      {skills.length === 0 ? (
        <p className="text-muted mt-3 text-sm">Reliez des compétences à vos expériences pour les voir ici.</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {skills.map((s) => (
            <li key={s.name}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-navy truncate font-medium">{s.name}</span>
                <span className="text-navy shrink-0 text-xs font-semibold">{s.score}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={s.name}
                aria-valuenow={s.score}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-blue-100"
              >
                <div className="bg-brand h-full rounded-full" style={{ width: `${s.score}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ValuePromo() {
  return (
    <section className="from-navy to-brand shadow-lift rounded-2xl bg-gradient-to-br p-5 text-white">
      <div className="flex items-start gap-3">
        <Target className="size-9 shrink-0 text-amber-300" aria-hidden />
        <div>
          <h2 className="text-lg leading-snug font-bold">Votre expérience a de la valeur !</h2>
          <p className="mt-2 text-sm text-white/80">
            Complétez votre parcours et attirez plus d&apos;opportunités.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/skillpass"
        className="text-navy mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold hover:bg-blue-50"
      >
        Voir mon SkillPass <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
