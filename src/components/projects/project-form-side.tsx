import Link from "next/link";
import { CheckCircle2, Lightbulb, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const TIPS = [
  "Choisissez un titre clair et descriptif",
  "Expliquez le contexte et les objectifs",
  "Mettez en avant votre rôle et vos contributions",
  "Ajoutez des captures d'écran ou une vidéo",
  "Listez les technologies utilisées",
  "Montrez les résultats et l'impact",
];

const EXAMPLES = [
  {
    name: "A' Quotation",
    summary: "Application de cotation logistique",
    techs: ["Power Apps", "Dataverse"],
    tone: "from-blue-500 to-indigo-700",
  },
  {
    name: "MonTicket CI",
    summary: "Réservation de tickets de transport",
    techs: ["React", "Node.js"],
    tone: "from-orange-400 to-rose-600",
  },
  {
    name: "ROAD TRACE",
    summary: "Optimisation d'itinéraires",
    techs: ["Power BI", "Azure"],
    tone: "from-emerald-500 to-teal-700",
  },
];

const card = "border-border/60 shadow-soft rounded-2xl border bg-white p-5";

export function ProjectTips() {
  return (
    <section aria-labelledby="tips-title" className={cn(card, "bg-amber-50/40")}>
      <h2 id="tips-title" className="text-navy flex items-center gap-2 font-bold">
        <Lightbulb className="size-5 text-amber-500" aria-hidden /> Conseils pour un projet impactant
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

export function ProjectQuote() {
  return (
    <figure className="rounded-2xl bg-blue-50 p-5">
      <Quote className="text-brand size-6" aria-hidden />
      <blockquote className="text-navy mt-1 text-sm leading-relaxed">
        Un projet bien présenté vaut mieux qu&apos;une longue description. Montrez ce que vous savez faire !
      </blockquote>
    </figure>
  );
}

/** Clicking an example pre-fills the title (it travels in the URL, so it works without JS). */
export function PopularProjects() {
  return (
    <section aria-labelledby="popular-title" className={card}>
      <h2 id="popular-title" className="text-navy flex items-center gap-2 font-bold">
        <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden /> Exemples de projets populaires
      </h2>
      <ul className="mt-4 space-y-3">
        {EXAMPLES.map((e) => (
          <li key={e.name}>
            <Link
              href={`/dashboard/projects/new?name=${encodeURIComponent(e.name)}`}
              className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-blue-50"
            >
              <span aria-hidden className={cn("size-14 shrink-0 rounded-lg bg-gradient-to-br", e.tone)} />
              <span className="min-w-0 text-sm">
                <span className="text-navy block font-semibold">{e.name}</span>
                <span className="text-muted block">{e.summary}</span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {e.techs.map((t) => (
                    <span
                      key={t}
                      className="text-brand rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
