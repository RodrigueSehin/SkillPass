import { CheckCircle2, Lightbulb, Network, Quote } from "lucide-react";

const TIPS = [
  "Choisissez une personne qui vous connaît bien",
  "Soyez personnalisé et courtois",
  "Expliquez l'objectif de votre demande",
  "Suggérez les points à aborder",
  "Remerciez à l'avance",
  "Relancez si nécessaire",
];

const card = "border-border/60 shadow-soft rounded-2xl border bg-white p-5";

export function RequestTips() {
  return (
    <section aria-labelledby="request-tips-title" className={`${card} bg-amber-50/40`}>
      <h2 id="request-tips-title" className="text-navy flex items-center gap-2 font-bold">
        <Lightbulb className="size-5 text-amber-500" aria-hidden /> Conseils pour une demande efficace
      </h2>
      <ul className="mt-4 space-y-2.5">
        {TIPS.map((t) => (
          <li key={t} className="text-navy flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden /> {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RequestQuote() {
  return (
    <figure className="rounded-2xl bg-blue-50 p-5">
      <Quote className="text-brand size-6" aria-hidden />
      <blockquote className="text-navy mt-1 text-sm leading-relaxed">
        Une bonne recommandation peut ouvrir des portes que vous n&apos;imaginez pas.
      </blockquote>
    </figure>
  );
}

export function NetworkMakesTheDifference() {
  return (
    <section className={`${card} flex items-center gap-4`}>
      <Network className="text-brand size-12 shrink-0" aria-hidden />
      <div>
        <h2 className="text-navy font-bold">Votre réseau fait la différence</h2>
        <p className="text-muted mt-1.5 text-sm">
          Des recommandations authentiques renforcent votre crédibilité et augmentent vos opportunités
          professionnelles.
        </p>
      </div>
    </section>
  );
}
