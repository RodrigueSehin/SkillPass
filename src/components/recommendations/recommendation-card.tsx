import { Quote, Star } from "lucide-react";
import { initialsOf, recommendationDate } from "@/lib/recommendation-view";
import { cn } from "@/lib/utils/cn";
import { RECOMMENDATION_RELATION_LABELS } from "@/schemas/verification";
import { RECOMMENDATION_STATUS_LABELS, type RecommendationDTO } from "@/types/verification";
import { RecommendationActions } from "./recommendation-editor";

const RELATION_TONE: Record<string, string> = {
  MANAGER: "bg-blue-50 text-brand",
  COLLEAGUE: "bg-sky-50 text-sky-700",
  CLIENT: "bg-green-50 text-green-700",
  PARTNER: "bg-purple-50 text-purple-700",
  MENTOR: "bg-amber-50 text-amber-700",
  OTHER: "bg-slate-100 text-slate-600",
};

const STATUS_TONE = {
  REQUESTED: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  DECLINED: "bg-red-50 text-danger",
} as const;

const AVATAR_TONES = ["bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-orange-500", "bg-rose-600"];
const avatarFor = (name: string) =>
  AVATAR_TONES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_TONES.length];

function Stars({ rating }: { rating: number }) {
  return (
    <span role="img" aria-label={`${rating} sur 5`} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("size-4", n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300")}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function RecommendationCard({
  recommendation: r,
  link,
}: {
  recommendation: RecommendationDTO;
  /** Link to send to the recommender; only set while the request can still be answered. */
  link: string | null;
}) {
  const relation = r.relation ? (RECOMMENDATION_RELATION_LABELS as Record<string, string>)[r.relation] : null;
  // Skill the request was about, shown with the keywords the recommender chose.
  const tags = [...new Set([...(r.skillName ? [r.skillName] : []), ...r.keywords])];

  return (
    <article className="border-border/60 shadow-soft hover:shadow-lift rounded-2xl border bg-white p-4 transition-shadow sm:p-5">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
            avatarFor(r.authorName),
          )}
        >
          {initialsOf(r.authorName) || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              <h2 className="text-navy font-bold">{r.authorName}</h2>
              {r.authorTitle && <p className="text-muted text-sm">{r.authorTitle}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
              <span className="text-muted text-xs">{recommendationDate(r)}</span>
              {r.rating !== null && <Stars rating={r.rating} />}
              <span className="flex gap-1.5 text-[11px] font-semibold">
                {relation && (
                  <span className={cn("rounded-full px-2.5 py-0.5", RELATION_TONE[r.relation ?? "OTHER"])}>
                    {relation}
                  </span>
                )}
                <span className={cn("rounded-full px-2.5 py-0.5", STATUS_TONE[r.status])}>
                  {RECOMMENDATION_STATUS_LABELS[r.status]}
                </span>
              </span>
            </div>
          </div>

          {r.content && (
            <p className="text-navy/85 mt-2 flex gap-2 text-sm leading-relaxed">
              <Quote className="text-brand mt-0.5 size-4 shrink-0 fill-current" aria-hidden />
              <span className="line-clamp-4">{r.content}</span>
            </p>
          )}

          {tags.length > 0 && (
            <ul aria-label="Mots-clés" className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <li key={t} className="text-brand rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium">
                  {t}
                </li>
              ))}
            </ul>
          )}

          <RecommendationActions
            id={r.id}
            authorName={r.authorName}
            submitted={r.status === "SUBMITTED"}
            link={link}
          />
        </div>
      </div>
    </article>
  );
}
