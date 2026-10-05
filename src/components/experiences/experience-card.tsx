import { Laptop, MapPin, Paperclip } from "lucide-react";
import type { ItemView } from "@/components/resources/resource-manager";
import { experiencePeriod, isCurrent } from "@/lib/experience-view";
import { stripFormatting } from "@/lib/rich-text";
import { cn } from "@/lib/utils/cn";
import { CONTRACT_LABELS, WORK_MODE_LABELS } from "@/schemas/portfolio";
import type { ExperienceDTO } from "@/types/portfolio";
import { ExperienceCardActions, ExperienceDetailsButton } from "./experience-editor";

const TILES = [
  "bg-blue-100 text-blue-700",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
];

/** Same colour for the same company, whatever the order of the list. */
const tileFor = (company: string) =>
  TILES[[...company].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TILES.length];

const CONTRACT_TONE: Record<string, string> = {
  CDI: "bg-purple-50 text-purple-700",
  CDD: "bg-emerald-50 text-emerald-700",
  INTERNSHIP: "bg-blue-50 text-blue-700",
  FREELANCE: "bg-amber-50 text-amber-700",
  APPRENTICESHIP: "bg-cyan-50 text-cyan-700",
  ACADEMIC: "bg-fuchsia-50 text-fuchsia-700",
};

const MAX_SKILLS = 4;

export function ExperienceCard({ experience: e, item }: { experience: ExperienceDTO; item: ItemView }) {
  const contract = e.contractType ? (CONTRACT_LABELS as Record<string, string>)[e.contractType] : null;
  const mode = e.workMode ? (WORK_MODE_LABELS as Record<string, string>)[e.workMode] : null;

  return (
    <article className="border-border/60 shadow-soft hover:shadow-lift rounded-2xl border bg-white p-4 transition-shadow sm:p-5">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-xl text-xl font-extrabold",
            tileFor(e.company),
          )}
        >
          {e.company.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              <h2 className="text-navy text-base leading-snug font-bold">{e.title}</h2>
              <p className="text-brand text-sm font-semibold">{e.company}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-end gap-1.5">
                <p className="text-muted text-xs">{experiencePeriod(e)}</p>
                <div className="flex flex-wrap justify-end gap-1.5 text-[11px] font-semibold">
                  {isCurrent(e) && (
                    <span className="text-success flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5">
                      <span aria-hidden className="size-1.5 rounded-full bg-green-600" /> En cours
                    </span>
                  )}
                  {contract && (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5",
                        CONTRACT_TONE[e.contractType ?? ""] ?? "bg-slate-100 text-slate-600",
                      )}
                    >
                      {contract}
                    </span>
                  )}
                </div>
              </div>
              <ExperienceCardActions item={item} />
            </div>
          </div>

          {(e.location || mode) && (
            <p className="text-muted mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {e.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden /> {e.location}
                </span>
              )}
              {mode && (
                <span className="flex items-center gap-1">
                  <Laptop className="size-3.5" aria-hidden /> {mode}
                </span>
              )}
            </p>
          )}

          {e.description && (
            <p className="text-navy/80 mt-2 line-clamp-2 text-sm">{stripFormatting(e.description)}</p>
          )}

          {e.documents.length > 0 && (
            <ul aria-label="Pièces jointes" className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {e.documents.map((d) => (
                <li key={d.id}>
                  <a
                    href={`/api/experiences/${e.id}/documents/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-brand flex items-center gap-1 text-xs"
                  >
                    <Paperclip className="size-3.5" aria-hidden /> {d.name}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <ul aria-label="Compétences" className="flex flex-wrap gap-1.5">
              {e.skills.slice(0, MAX_SKILLS).map((s) => (
                <li key={s} className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium">
                  {s}
                </li>
              ))}
              {e.skills.length > MAX_SKILLS && (
                <li className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium">
                  +{e.skills.length - MAX_SKILLS}
                </li>
              )}
            </ul>
            <ExperienceDetailsButton item={item} />
          </div>
        </div>
      </div>
    </article>
  );
}
