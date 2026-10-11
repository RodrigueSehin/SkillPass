import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Briefcase,
  CalendarClock,
  FolderKanban,
  MapPin,
  Sparkles,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LEVEL_CHIP, skillVisual } from "@/config/skill-visuals";
import { cn } from "@/lib/utils/cn";
import { formatMonth, formatPeriod } from "@/lib/utils/format";
import type { ScoreResult } from "@/lib/score";
import type { Passport } from "@/services/passport.service";
import { AVAILABILITY_LABELS, type PublicProfileDTO } from "@/types/profile";
import { SKILL_LEVEL_LABELS } from "@/types/skill";
import { SkillPassScore } from "@/components/skills/skillpass-score";

/** Shared by Mon SkillPass and the public profile: links only ever stay inside the passport. */
interface CardProps {
  /** Link to the tab that lists everything, or undefined to hide "Voir tout". */
  moreHref?: string;
}

function Section({
  id,
  title,
  icon: Icon,
  moreHref,
  children,
}: {
  id: string;
  title: string;
  icon: typeof Sparkles;
  moreHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="border-border/60 shadow-soft min-w-0 rounded-2xl border bg-white p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-navy flex items-center gap-2 text-base font-bold sm:text-lg">
          <Icon className="text-brand size-5" aria-hidden /> {title}
        </h2>
        {moreHref && (
          <Link
            href={moreHref}
            scroll={false}
            className="text-brand flex shrink-0 items-center gap-1 text-sm font-semibold hover:underline"
          >
            Voir tout <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const Empty = ({ icon, title }: { icon: typeof Sparkles; title: string }) => (
  <EmptyState className="mt-3 border-0 py-6" icon={icon} title={title} />
);

export function AboutCard({ profile, years }: { profile: PublicProfileDTO; years: number }) {
  const facts = [
    years > 0 && [CalendarClock, `${years} an${years > 1 ? "s" : ""} d'expérience`],
    profile.profession && [Briefcase, profile.profession],
    [BadgeCheck, AVAILABILITY_LABELS[profile.availability]],
    profile.location && [MapPin, profile.location],
  ].filter((f): f is [typeof MapPin, string] => Boolean(f));

  return (
    <Section id="about-title" title="À propos de moi" icon={Sparkles}>
      {profile.bio ? (
        <p className="text-muted mt-3 text-sm leading-relaxed">{profile.bio}</p>
      ) : (
        <p className="text-muted mt-3 text-sm">Aucune présentation renseignée.</p>
      )}
      <ul className="mt-4 space-y-2.5">
        {facts.map(([Icon, text]) => (
          <li key={text} className="text-navy flex items-center gap-3 text-sm">
            <Icon className="text-brand size-4 shrink-0" aria-hidden /> {text}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function TopSkillsCard({ skills, moreHref }: CardProps & { skills: Passport["skills"] }) {
  return (
    <Section id="passport-top-skills" title="Top compétences" icon={Sparkles} moreHref={moreHref}>
      {skills.length === 0 ? (
        <Empty icon={Sparkles} title="Aucune compétence renseignée" />
      ) : (
        <ul className="divide-border/60 mt-2 divide-y">
          {skills.slice(0, 5).map((s) => {
            const { icon: Icon, tile } = skillVisual(s.name);
            return (
              <li key={s.id} className="py-3">
                {/* Two lines whatever the card width: name and score, then the bar. Nothing can overflow. */}
                <div className="flex items-center gap-3">
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tile)}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-navy text-sm font-semibold">{s.name}</span>
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", LEVEL_CHIP[s.level])}>
                      {SKILL_LEVEL_LABELS[s.level]}
                    </span>
                  </span>
                  <span className="text-navy shrink-0 text-sm font-bold">{s.score}%</span>
                </div>
                <span
                  role="progressbar"
                  aria-label={`${s.name} : ${s.score}%`}
                  aria-valuenow={s.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-2 block h-2 overflow-hidden rounded-full bg-slate-100"
                >
                  <span className="bg-brand block h-full rounded-full" style={{ width: `${s.score}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

export function BadgesCard({ credentials, moreHref }: CardProps & { credentials: Passport["credentials"] }) {
  return (
    <Section id="passport-badges" title="Mes badges" icon={BadgeCheck} moreHref={moreHref}>
      {credentials.length === 0 ? (
        <Empty icon={BadgeCheck} title="Aucun badge pour l'instant" />
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {credentials.slice(0, 6).map((c) => {
            const { icon: Icon, tile } = skillVisual(c.skillName);
            return (
              <li key={c.credentialId}>
                <Link
                  href={`/verify/${c.credentialId}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-2 text-center hover:bg-slate-50"
                >
                  <span className={cn("relative flex size-14 items-center justify-center rounded-2xl", tile)}>
                    <Icon className="size-7" aria-hidden />
                    <BadgeCheck
                      className="text-success absolute -right-1 -bottom-1 size-5 rounded-full bg-white"
                      aria-label="Vérifié"
                    />
                  </span>
                  <span className="text-navy text-xs leading-tight font-semibold">{c.skillName}</span>
                  <span className="text-muted text-[11px]">{SKILL_LEVEL_LABELS[c.level]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

export function CertificationsCard({
  certifications,
  moreHref,
}: CardProps & { certifications: Passport["certifications"] }) {
  return (
    <Section id="passport-certs" title="Mes certifications" icon={Award} moreHref={moreHref}>
      {certifications.length === 0 ? (
        <Empty icon={Award} title="Aucune certification" />
      ) : (
        <ul className="divide-border/60 mt-2 divide-y">
          {certifications.slice(0, 3).map((c) => {
            const verified = c.verificationStatus === "VERIFIED" && !c.expired;
            return (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Award className="size-6" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-navy block truncate text-sm font-semibold">{c.name}</span>
                  <span className="text-muted block truncate text-xs">
                    {c.issuer} · {formatMonth(c.issueDate)}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold",
                    c.expired
                      ? "bg-red-50 text-red-600"
                      : verified
                        ? "text-success bg-green-50"
                        : "bg-slate-100 text-slate-600",
                  )}
                >
                  {c.expired ? "Expirée" : verified ? "Vérifiée" : "Non vérifiée"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// Gradients stand in for project screenshots (images arrive with the portfolio feature).
const THUMBS = [
  "from-blue-600 to-indigo-700",
  "from-sky-500 to-blue-700",
  "from-slate-700 to-slate-900",
  "from-cyan-600 to-blue-800",
] as const;

export function ProjectsCard({ projects, moreHref }: CardProps & { projects: Passport["projects"] }) {
  return (
    <Section id="passport-projects" title="Mes projets récents" icon={FolderKanban} moreHref={moreHref}>
      {projects.length === 0 ? (
        <Empty icon={FolderKanban} title="Aucun projet" />
      ) : (
        <ul className="divide-border/60 mt-2 divide-y">
          {projects.slice(0, 3).map((p, i) => (
            <li key={p.id} className="flex items-center gap-4 py-3">
              <span
                aria-hidden
                className={`flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white ${THUMBS[i % THUMBS.length]}`}
              >
                {p.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-navy block truncate text-sm font-semibold">{p.name}</span>
                {p.description && <span className="text-muted block truncate text-xs">{p.description}</span>}
                <span className="mt-1.5 flex flex-wrap gap-1.5">
                  {p.skills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="text-brand rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </span>
              </span>
              <span className="text-muted hidden shrink-0 text-xs sm:block">
                {formatMonth(p.endDate ?? p.startDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function ExperiencesCard({
  experiences,
  moreHref,
}: CardProps & { experiences: Passport["experiences"] }) {
  return (
    <Section
      id="passport-experiences"
      title="Expériences professionnelles"
      icon={Briefcase}
      moreHref={moreHref}
    >
      {experiences.length === 0 ? (
        <Empty icon={Briefcase} title="Aucune expérience" />
      ) : (
        <ul className="divide-border/60 mt-2 divide-y">
          {experiences.slice(0, 3).map((e) => (
            <li key={e.id} className="flex items-center gap-4 py-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Briefcase className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-navy block truncate text-sm font-semibold">{e.company}</span>
                <span className="text-muted block truncate text-xs">{e.title}</span>
              </span>
              <span className="text-muted hidden shrink-0 text-xs sm:block">
                {formatPeriod(e.startDate, e.endDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Overall score plus the three criteria that weigh most, each as a share of its maximum. */
export function EvaluationCard({ score, moreHref }: CardProps & { score: ScoreResult }) {
  const top = [...score.criteria].sort((a, b) => b.max - a.max).slice(0, 3);
  return (
    <Section id="passport-evaluation" title="Évaluation de compétences" icon={BadgeCheck} moreHref={moreHref}>
      <div className="mt-4 flex items-center gap-4">
        <SkillPassScore score={score.total} size={84} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-navy text-sm font-bold">Score global</p>
          <p className="text-muted text-xs">
            Calculé à partir de critères visibles, détaillés dans l&apos;onglet Évaluations.
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2.5">
        {top.map((c) => {
          const pct = Math.round((c.points / c.max) * 100);
          return (
            <li key={c.key} className="flex items-center gap-3 text-xs">
              <span className="text-navy w-28 shrink-0 truncate">{c.label}</span>
              <span
                role="progressbar"
                aria-label={`${c.label} : ${pct}%`}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="block h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
              >
                <span className="bg-brand block h-full rounded-full" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-navy w-9 shrink-0 text-right font-semibold">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
