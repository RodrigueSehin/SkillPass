import Link from "next/link";
import { Award, BadgeCheck, Briefcase, ExternalLink, FolderKanban, MapPin, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ScoreResult } from "@/lib/score";
import { SKILL_LEVEL_LABELS } from "@/types/skill";
import type { TalentDetail } from "@/types/talent";
import { AVAILABILITY_SHORT, TalentAvatar } from "./talent-cards";
import { Panel } from "./ui";

export const TALENT_TABS = [
  ["overview", "Vue d'ensemble"],
  ["skills", "Compétences"],
  ["projects", "Projets"],
  ["experiences", "Expériences"],
] as const;
export type TalentTab = (typeof TALENT_TABS)[number][0];
export const parseTalentTab = (v: string | undefined): TalentTab =>
  TALENT_TABS.find(([k]) => k === v)?.[0] ?? "overview";

const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" });
const month = (iso: string) => MONTH.format(new Date(`${iso}T00:00:00Z`));

function ScoreRing({ value }: { value: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-slate-100" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
          className="stroke-emerald-500"
        />
      </svg>
      <p
        className="absolute inset-0 flex flex-col items-center justify-center"
        role="img"
        aria-label={`Score ${value} sur 100`}
      >
        <span className="text-navy text-3xl leading-none font-bold">{value}</span>
        <span className="text-muted text-xs">/100</span>
      </p>
    </div>
  );
}

export function TalentPanel({
  detail,
  score,
  tab,
  hrefFor,
  closeHref,
}: {
  detail: TalentDetail;
  score: ScoreResult;
  tab: TalentTab;
  hrefFor: (tab: TalentTab) => string;
  closeHref: string;
}) {
  const t = detail.record;
  const availability = AVAILABILITY_SHORT[t.availability];
  const skills = [...t.skills].sort((a, b) => b.score - a.score);
  const verified = t.skills.some((s) => s.verified);
  const stat = (value: number | string, label: string, Icon: typeof Award) => (
    <div className="flex items-center gap-2.5">
      <Icon className="text-brand size-5" aria-hidden />
      <p className="text-sm">
        <span className="text-navy block text-lg leading-none font-bold">{value}</span>
        <span className="text-muted text-xs">{label}</span>
      </p>
    </div>
  );

  return (
    <Panel className="p-5" aria-label={`Profil de ${t.fullName}`}>
      <div className="flex items-start gap-4">
        <TalentAvatar name={t.fullName} className="size-24 text-3xl" />
        <div className="min-w-0 flex-1">
          <h2 className="text-navy flex items-center gap-1.5 text-xl font-bold">
            {t.fullName}
            {verified && <BadgeCheck className="text-brand size-5" aria-label="Compétences vérifiées" />}
          </h2>
          <p className="text-navy/85 text-sm">{t.headline ?? t.profession}</p>
          {t.location && (
            <p className="text-muted mt-1 flex items-center gap-1 text-sm">
              <MapPin className="size-3.5" aria-hidden /> {t.location}
            </p>
          )}
          <p className="text-navy mt-2 flex items-center gap-1.5 text-xs font-medium">
            <span className={cn("size-2 rounded-full", availability.tone)} aria-hidden /> {availability.label}
          </p>
        </div>
        <Link
          href={closeHref}
          scroll={false}
          aria-label="Fermer le profil"
          className="text-muted hover:text-navy"
        >
          <X className="size-5" />
        </Link>
      </div>

      <nav
        aria-label="Sections du profil"
        className="border-border/60 mt-5 flex gap-4 overflow-x-auto border-b"
      >
        {TALENT_TABS.map(([key, label]) => (
          <Link
            key={key}
            href={hrefFor(key)}
            scroll={false}
            aria-current={key === tab ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-0.5 py-2.5 text-[13px] font-medium",
              key === tab
                ? "border-brand text-brand font-semibold"
                : "text-navy hover:text-brand border-transparent",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-5 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-navy mb-2 text-sm font-bold">SkillPass Score</p>
              <ScoreRing value={score.total} />
            </div>
            <div className="grid flex-1 grid-cols-2 gap-4">
              {stat(t.skills.length, "Compétences", Sparkles)}
              {stat(t.certifications.length, "Certifications", Award)}
              {stat(t.projectCount, "Projets", FolderKanban)}
              {stat(`${t.yearsOfExperience} ans`, "Expérience", Briefcase)}
            </div>
          </div>
          <SkillList
            skills={skills.slice(0, 6)}
            title="Compétences principales"
            moreHref={skills.length > 6 ? hrefFor("skills") : undefined}
          />
          {t.certifications.length > 0 && (
            <section>
              <h3 className="text-navy mb-2 font-bold">Certifications</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {t.certifications.slice(0, 4).map((c) => (
                  <li key={`${c.name}-${c.date}`} className="border-border/70 rounded-xl border p-3 text-sm">
                    <p className="text-navy flex items-center gap-1 font-semibold">
                      {c.name}{" "}
                      {c.verified && <BadgeCheck className="text-brand size-4" aria-label="Vérifiée" />}
                    </p>
                    <p className="text-muted text-xs">
                      {c.issuer} · {month(c.date)}
                      {c.expired && " · expirée"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {detail.projects.length > 0 && (
            <section>
              <h3 className="text-navy mb-2 font-bold">Projets récents</h3>
              <ul className="space-y-2">
                {detail.projects.slice(0, 3).map((p) => (
                  <li key={p.name} className="border-border/70 rounded-xl border p-3 text-sm">
                    <p className="text-navy font-semibold">{p.name}</p>
                    <p className="text-muted text-xs">
                      {[p.organization, p.domain].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {tab === "skills" && (
        <div className="mt-5">
          <SkillList skills={skills} title="Toutes les compétences" />
        </div>
      )}

      {tab === "projects" && (
        <ul className="mt-5 space-y-2">
          {detail.projects.length === 0 && <li className="text-muted text-sm">Aucun projet public.</li>}
          {detail.projects.map((p) => (
            <li key={p.name} className="border-border/70 rounded-xl border p-3 text-sm">
              <p className="text-navy font-semibold">{p.name}</p>
              <p className="text-muted text-xs">{[p.organization, p.domain].filter(Boolean).join(" · ")}</p>
            </li>
          ))}
        </ul>
      )}

      {tab === "experiences" && (
        <ul className="mt-5 space-y-2">
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

      <div className="mt-6">
        <Link
          href={`/${t.username}`}
          target="_blank"
          rel="noopener"
          className="bg-brand flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white hover:bg-blue-700"
        >
          <ExternalLink className="size-4" aria-hidden /> Voir le profil public
        </Link>
        <p className="text-muted mt-2 text-center text-xs">
          Les coordonnées restent privées : le contact passe par le profil public du talent.
        </p>
      </div>
    </Panel>
  );
}

function SkillList({
  skills,
  title,
  moreHref,
}: {
  skills: TalentDetail["record"]["skills"];
  title: string;
  moreHref?: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-navy font-bold">{title}</h3>
        {moreHref && (
          <Link href={moreHref} scroll={false} className="text-brand text-xs font-semibold hover:underline">
            Voir toutes
          </Link>
        )}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {skills.map((s) => (
          <li key={s.name} className="border-border/70 flex items-center gap-2 rounded-xl border p-3 text-sm">
            <span className="min-w-0 flex-1">
              <span className="text-navy flex items-center gap-1 font-semibold">
                <span className="truncate">{s.name}</span>
                {s.verified && <BadgeCheck className="text-brand size-4 shrink-0" aria-label="Vérifiée" />}
              </span>
              <span className="text-muted text-xs">{SKILL_LEVEL_LABELS[s.level]}</span>
            </span>
            <span className="text-navy text-sm font-bold">{s.score}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
