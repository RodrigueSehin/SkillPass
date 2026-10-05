import { BarChart3, CheckCircle2, Lightbulb, Quote } from "lucide-react";

const TIPS = [
  "Soyez précis sur votre titre et vos missions",
  "Mettez en avant vos réalisations avec des résultats concrets",
  "Ajoutez des compétences pertinentes",
  "Utilisez des chiffres quand c'est possible",
  "Restez concis et professionnel",
];

const card = "border-border/60 shadow-soft rounded-2xl border bg-white p-5";

export function ExperienceTips() {
  return (
    <section aria-labelledby="tips-title" className={`${card} bg-amber-50/40`}>
      <h2 id="tips-title" className="text-navy flex items-center gap-2 font-bold">
        <Lightbulb className="size-5 text-amber-500" aria-hidden /> Conseils pour une expérience percutante
      </h2>
      <ul className="mt-4 space-y-3">
        {TIPS.map((t) => (
          <li key={t} className="text-navy flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden /> {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ExperienceQuote() {
  return (
    <figure className="rounded-2xl bg-blue-50 p-5">
      <Quote className="text-brand size-6" aria-hidden />
      <blockquote className="text-navy mt-1 text-sm leading-relaxed">
        Chaque expérience est une occasion d&apos;apprendre, de grandir et d&apos;avoir un grand impact.
      </blockquote>
    </figure>
  );
}

export function ExperienceValueHint() {
  return (
    <section className={`${card} flex items-center justify-between gap-4 bg-blue-50/50`}>
      <div>
        <h2 className="text-navy font-bold">Valorisez votre parcours</h2>
        <p className="text-muted mt-2 text-sm">
          Une expérience bien décrite augmente vos chances d&apos;être contacté par des recruteurs.
        </p>
      </div>
      <BarChart3 className="text-brand/40 size-12 shrink-0" aria-hidden />
    </section>
  );
}
