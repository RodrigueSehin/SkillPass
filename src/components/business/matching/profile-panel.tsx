import Link from "next/link";
import { BadgeCheck, Check, ExternalLink, MapPin, Briefcase, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { strengths, synthesis } from "@/lib/business/matching-view";
import { SKILL_LEVEL_LABELS } from "@/types/skill";
import type { TalentDetail } from "@/types/talent";
import { AVAILABILITY_SHORT, TalentAvatar } from "../talent-cards";
import { Panel } from "../ui";
import { MatchRing } from "./ring";
import { SaveButton } from "./save-button";

const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" });
const month = (iso: string) => MONTH.format(new Date(`${iso}T00:00:00Z`));

export const PANEL_TABS = [
  ["resume", "Résumé"],
  ["competences", "Compétences"],
  ["experiences", "Expériences"],
] as const;
export type PanelTab = (typeof PANEL_TABS)[number][0];
export const parsePanelTab = (v: string | undefined): PanelTab =>
  PANEL_TABS.find(([k]) => k === v)?.[0] ?? "resume";

/** Right-hand profile of a talent, shared by the search and the saved list. Public profile data only. */
export function MatchProfilePanel({
  detail,
  match,
  wanted,
  compatible,
  closeHref,
  saved,
  canSave,
  jobOfferId,
  tab,
  tabHref,
  footer,
}: {
  detail: TalentDetail;
  match: number | null;
  /** The skills the match was computed against. */
  wanted: string[];
  /** Open offers this talent fits, best first. */
  compatible: { id: string; title: string; place: string; score: number }[];
  closeHref: string;
  saved: boolean;
  canSave: boolean;
  jobOfferId: string | null;
  tab: PanelTab;
  tabHref: (tab: PanelTab) => string;
  /** Extra controls under the profile (status, share, remove). */
  footer?: React.ReactNode;
}) {
  const t = detail.record;
  const availability = AVAILABILITY_SHORT[t.availability];
  const skills = [...t.skills].sort((a, b) => b.score - a.score);
  const points = strengths(t, wanted);
  const verified = t.skills.some((s) => s.verified);

  return (
    <Panel className="p-5" aria-label={`Profil de ${t.fullName}`}>
      <div className="flex items-start gap-4">
        <TalentAvatar name={t.fullName} avatar={t.avatar} profileId={t.id} className="size-20 text-2xl" />
        <div className="min-w-0 flex-1">
          <h2 className="text-navy flex items-center gap-1.5 text-xl font-bold">
            <span className="truncate">{t.fullName}</span>
            {verified && (
              <BadgeCheck className="text-brand size-5 shrink-0" aria-label="Compétences vérifiées" />
            )}
          </h2>
          <p className="text-navy/85 text-sm">{t.profession ?? t.headline ?? "—"}</p>
          <p className="text-navy mt-1.5 flex items-center gap-1.5 text-xs font-medium">
            <span className={cn("size-2 rounded-full", availability.tone)} aria-hidden /> {availability.label}
          </p>
          <p className="text-muted mt-1 flex flex-wrap gap-x-3 text-xs">
            {t.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" aria-hidden /> {t.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Briefcase className="size-3" aria-hidden /> {t.yearsOfExperience} an
              {t.yearsOfExperience > 1 ? "s" : ""} d&apos;expérience
            </span>
          </p>
        </div>
        {match !== null && (
          <div className="text-center">
            <MatchRing value={match} size="lg" />
            <p className="text-muted mt-0.5 text-[11px]">Correspondance</p>
          </div>
        )}
        <Link
          href={closeHref}
          scroll={false}
          aria-label="Fermer le profil"
          className="text-muted hover:text-navy"
        >
          <X className="size-5" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href={`/${t.username}`}
          target="_blank"
          rel="noopener"
          className="bg-brand flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white hover:bg-blue-700"
        >
          <ExternalLink className="size-4" aria-hidden /> Contacter
        </Link>
        <SaveButton
          username={t.username}
          saved={saved}
          jobOfferId={jobOfferId}
          match={match}
          disabled={!canSave}
          label={saved ? "Sauvegardé" : "Ajouter aux favoris"}
          className="w-full"
        />
      </div>
      <p className="text-muted mt-2 text-xs">
        Les coordonnées restent privées : le contact passe par le profil public du talent.
      </p>

      <nav aria-label="Sections du profil" className="border-border/60 mt-4 flex gap-5 border-b">
        {PANEL_TABS.map(([key, label]) => (
          <Link
            key={key}
            href={tabHref(key)}
            scroll={false}
            aria-current={key === tab ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-0.5 py-2.5 text-[13px] font-medium",
              key === tab
                ? "border-brand text-brand font-semibold"
                : "text-navy hover:text-brand border-transparent",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "resume" && (
        <div className="mt-4 space-y-5">
          <section className="flex gap-3 rounded-xl bg-slate-50 p-4">
            <Sparkles className="text-brand mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <h3 className="text-navy text-sm font-bold">Synthèse</h3>
              <p className="text-navy/85 mt-1 text-sm">{synthesis(t, wanted)}</p>
            </div>
          </section>

          {points.length > 0 && (
            <section>
              <h3 className="text-navy mb-2 font-bold">Points forts</h3>
              <ul className="space-y-1.5">
                {points.slice(0, 5).map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <Check
                      className="mt-0.5 size-4 shrink-0 rounded-full bg-green-600 p-0.5 text-white"
                      aria-hidden
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-navy font-bold">Compétences principales</h3>
              {skills.length > 6 && (
                <Link
                  href={tabHref("competences")}
                  scroll={false}
                  className="text-brand text-xs font-semibold hover:underline"
                >
                  Voir tout ({skills.length})
                </Link>
              )}
            </div>
            <ul className="flex flex-wrap gap-2">
              {skills.slice(0, 6).map((s) => (
                <li
                  key={s.name}
                  className="text-brand rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold"
                >
                  {s.name}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-navy mb-2 font-bold">Offres compatibles</h3>
            {compatible.length === 0 ? (
              <p className="text-muted text-sm">Aucune de vos offres ouvertes ne correspond à ce profil.</p>
            ) : (
              <ul className="space-y-2">
                {compatible.slice(0, 3).map((o) => (
                  <li key={o.id} className="border-border/70 flex items-center gap-3 rounded-xl border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-navy truncate text-sm font-semibold">{o.title}</p>
                      <p className="text-muted truncate text-xs">{o.place}</p>
                    </div>
                    <span className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                      {o.score}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "competences" && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {skills.map((s) => (
            <li
              key={s.name}
              className="border-border/70 flex items-center gap-2 rounded-xl border p-3 text-sm"
            >
              <span className="min-w-0 flex-1">
                <span className="text-navy flex items-center gap-1 font-semibold">
                  <span className="truncate">{s.name}</span>
                  {s.verified && <BadgeCheck className="text-brand size-4 shrink-0" aria-label="Vérifiée" />}
                </span>
                <span className="text-muted text-xs">{SKILL_LEVEL_LABELS[s.level]}</span>
              </span>
              <span className="text-navy font-bold">{s.score}</span>
            </li>
          ))}
        </ul>
      )}

      {tab === "experiences" && (
        <ul className="mt-4 space-y-2">
          {detail.experiences.length === 0 && (
            <li className="text-muted text-sm">Aucune expérience renseignée.</li>
          )}
          {detail.experiences.map((e) => (
            <li key={`${e.title}-${e.startDate}`} className="border-border/70 rounded-xl border p-3 text-sm">
              <p className="text-navy font-semibold">{e.title}</p>
              <p className="text-muted text-xs">
                {e.company} · {month(e.startDate)} – {e.endDate ? month(e.endDate) : "aujourd'hui"}
              </p>
            </li>
          ))}
        </ul>
      )}

      {footer && <div className="mt-5 space-y-3">{footer}</div>}
    </Panel>
  );
}
