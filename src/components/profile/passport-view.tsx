import Image from "next/image";
import Link from "next/link";
import cityPhoto from "@/assets/profile/city.jpg";
import {
  Award,
  BadgeCheck,
  Briefcase,
  ExternalLink,
  FolderKanban,
  MapPin,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkillPassScore } from "@/components/skills/skillpass-score";
import { SkillProgress } from "@/components/skills/skill-progress";
import { VerificationBadge } from "@/components/skills/verification-badge";
import { formatMonth, formatPeriod } from "@/lib/utils/format";
import { yearsFromExperiences, type Passport } from "@/services/passport.service";
import { AVAILABILITY_LABELS, type PublicProfileDTO } from "@/types/profile";
import { VERIFICATION_STATUS_LABELS } from "@/types/skill";
import { CredentialBadge } from "@/components/verification/credential-badge";
import { appUrl } from "@/lib/utils/app-url";
import {
  AboutCard,
  BadgesCard,
  CertificationsCard,
  EvaluationCard,
  ExperiencesCard,
  ProjectsCard,
  TopSkillsCard,
} from "./overview-cards";
import { ScoreBreakdown } from "./score-breakdown";

export const PASSPORT_TABS = [
  ["overview", "Aperçu"],
  ["skills", "Compétences"],
  ["experiences", "Expériences"],
  ["projects", "Projets"],
  ["certifications", "Certifications"],
  ["badges", "Badges"],
  ["evaluations", "Évaluations"],
  ["recommendations", "Recommandations"],
] as const;
export type PassportTab = (typeof PASSPORT_TABS)[number][0];

export function parseTab(value: string | string[] | undefined): PassportTab {
  return PASSPORT_TABS.find(([key]) => key === value)?.[0] ?? "overview";
}

const CERT_TONES = {
  VERIFIED: "success",
  PENDING: "accent",
  UNVERIFIED: "neutral",
  EXPIRED: "danger",
} as const;

interface PassportViewProps {
  profile: PublicProfileDTO;
  passport: Passport;
  tab: PassportTab;
  /** Path used by the tab links, e.g. "/dashboard/skillpass" or "/sehin-rodrigue". */
  basePath: string;
  /** Absolute public URL encoded in the QR code. */
  publicUrl: string;
  actions?: React.ReactNode;
}

export function PassportView({ profile, passport, tab, basePath, publicUrl, actions }: PassportViewProps) {
  const initials = profile.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const { stats } = passport;
  const tabHref = (key: PassportTab) => (key === "overview" ? basePath : `${basePath}?tab=${key}`);
  const chips = passport.skills.slice(0, 4).map((s) => s.name);
  const kpis = [
    ["Compétences", stats.skills, Sparkles],
    ["Vérifiées", stats.verifiedSkills, BadgeCheck],
    ["Projets", stats.projects, FolderKanban],
    ["Certifications", stats.certifications, Award],
    ["Recommandations", stats.recommendations, MessageSquareQuote],
  ] as const;

  return (
    <div className="space-y-6">
      <header className="from-navy relative overflow-hidden rounded-3xl bg-gradient-to-br via-blue-900 to-blue-700 p-5 text-white sm:p-8">
        <Image
          src={cityPhoto}
          alt=""
          aria-hidden
          fill
          sizes="(min-width: 1280px) 60vw, 100vw"
          className="pointer-events-none object-cover object-right opacity-60"
        />
        <div
          aria-hidden
          className="from-navy via-navy/85 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent"
        />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-6">
            <span
              aria-hidden
              className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-white/80 bg-blue-600 text-2xl font-bold shadow-lg sm:size-32 sm:text-4xl"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {profile.fullName}
                {passport.isVerified && (
                  <BadgeCheck className="size-6 text-sky-300" aria-label="Profil vérifié" />
                )}
              </h1>
              {profile.headline && (
                <p className="mt-1 text-sm text-blue-100 sm:text-base">{profile.headline}</p>
              )}
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-blue-100">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-4" aria-hidden /> {profile.location}
                  </span>
                )}
                <span>{AVAILABILITY_LABELS[profile.availability]}</span>
              </p>
              {chips.length > 0 && (
                <ul aria-label="Compétences clés" className="mt-4 flex flex-wrap gap-2">
                  {chips.map((name) => (
                    <li
                      key={name}
                      className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center xl:shrink-0">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
              <p className="text-center text-xs font-semibold text-blue-100">SkillPass Score</p>
              <SkillPassScore
                score={passport.score.total}
                verified={passport.isVerified}
                size={120}
                tone="dark"
              />
            </div>
            <div className="rounded-2xl bg-white p-4 text-slate-900 shadow-lg">
              <div className="flex items-center gap-3">
                <QRCodeSVG
                  value={publicUrl}
                  size={72}
                  fgColor="#172554"
                  level="M"
                  title={`QR code vers ${publicUrl}`}
                />
                <div>
                  <p className="text-navy text-sm font-bold">Mon QR Code</p>
                  <p className="text-muted text-xs">Scannez pour vérifier mon profil</p>
                </div>
              </div>
              {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
            </div>
          </div>
        </div>

        <section
          aria-label="Indicateurs"
          className="relative mt-6 grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl bg-white p-4 text-slate-900 shadow-lg sm:grid-cols-5"
        >
          {kpis.map(([label, value, Icon]) => (
            <div key={label} className="flex min-w-0 items-center gap-3">
              <span className="text-brand flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="text-navy block text-xl leading-none font-extrabold">{value}</span>
                <span className="text-muted mt-1 block text-xs">{label}</span>
              </span>
            </div>
          ))}
        </section>
      </header>

      <nav aria-label="Sections du SkillPass" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="border-border flex min-w-max gap-1 border-b">
          {PASSPORT_TABS.map(([key, label]) => (
            <li key={key}>
              <Link
                href={tabHref(key)}
                scroll={false}
                aria-current={tab === key ? "page" : undefined}
                className={`inline-block border-b-2 px-4 py-3 text-sm font-medium ${
                  tab === key
                    ? "border-brand text-brand"
                    : "text-muted hover:text-foreground border-transparent"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <TabContent tab={tab} profile={profile} passport={passport} tabHref={tabHref} />
    </div>
  );
}

function TabContent({
  tab,
  profile,
  passport,
  tabHref,
}: {
  tab: PassportTab;
  profile: PublicProfileDTO;
  passport: Passport;
  tabHref: (key: PassportTab) => string;
}) {
  switch (tab) {
    case "overview": {
      const years = Math.max(profile.yearsOfExperience, yearsFromExperiences(passport.experiences));
      return (
        <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <AboutCard profile={profile} years={years} />
            <TopSkillsCard skills={passport.skills} moreHref={tabHref("skills")} />
            <ProjectsCard projects={passport.projects} moreHref={tabHref("projects")} />
            <ExperiencesCard experiences={passport.experiences} moreHref={tabHref("experiences")} />
          </div>
          <div className="grid min-w-0 gap-6 md:grid-cols-2 2xl:grid-cols-1">
            <BadgesCard credentials={passport.credentials} moreHref={tabHref("badges")} />
            <CertificationsCard
              certifications={passport.certifications}
              moreHref={tabHref("certifications")}
            />
            <div className="md:col-span-2 2xl:col-span-1">
              <EvaluationCard score={passport.score} moreHref={tabHref("evaluations")} />
            </div>
          </div>
        </div>
      );
    }

    case "badges":
      return passport.credentials.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="Aucun badge pour l'instant"
          description="Un badge vérifiable est délivré après une évaluation réussie et validée."
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {passport.credentials.map((c) => (
            <li key={c.credentialId}>
              <CredentialBadge
                credential={c}
                verifyUrl={`${appUrl()}/verify/${c.credentialId}`}
                showQr={false}
              />
            </li>
          ))}
        </ul>
      );

    case "evaluations":
      return (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Pourquoi ce score ?</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown score={passport.score} />
          </CardContent>
        </Card>
      );

    case "skills":
      return passport.skills.length === 0 ? (
        <EmptyState icon={Sparkles} title="Aucune compétence" />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {passport.skills.map((s) => (
            <li key={s.id}>
              <Card className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-muted text-sm">
                      {s.category ?? "Sans catégorie"} · {s.yearsOfExperience} an(s)
                    </p>
                  </div>
                  <VerificationBadge status={s.verificationStatus} />
                </div>
                <SkillProgress name="Score" score={s.score} />
              </Card>
            </li>
          ))}
        </ul>
      );

    case "certifications":
      return passport.certifications.length === 0 ? (
        <EmptyState icon={Award} title="Aucune certification" />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {passport.certifications.map((c) => {
            const status = c.expired ? "EXPIRED" : c.verificationStatus;
            return (
              <li key={c.id}>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-muted text-sm">
                        {c.issuer} · {formatMonth(c.issueDate)}
                      </p>
                    </div>
                    <Badge tone={CERT_TONES[status]}>{VERIFICATION_STATUS_LABELS[status]}</Badge>
                  </div>
                  {c.credentialId && (
                    <p className="text-muted mt-3 text-xs">Credential ID : {c.credentialId}</p>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      );

    case "experiences":
      return passport.experiences.length === 0 ? (
        <EmptyState icon={Briefcase} title="Aucune expérience" />
      ) : (
        <ul className="space-y-4">
          {passport.experiences.map((e) => (
            <li key={e.id}>
              <Card className="p-5">
                <p className="font-semibold">{e.title}</p>
                <p className="text-muted text-sm">{[e.company, e.location].filter(Boolean).join(" · ")}</p>
                <p className="text-muted mt-1 text-sm">{formatPeriod(e.startDate, e.endDate)}</p>
                {e.description && <p className="mt-3 text-sm">{e.description}</p>}
              </Card>
            </li>
          ))}
        </ul>
      );

    case "projects":
      return passport.projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Aucun projet" />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {passport.projects.map((p) => (
            <li key={p.id}>
              <Card className="h-full p-5">
                <p className="font-semibold">{p.name}</p>
                <p className="text-muted text-sm">{[p.organization, p.role].filter(Boolean).join(" · ")}</p>
                {p.description && <p className="mt-3 text-sm">{p.description}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.skills.map((s) => (
                    <Badge key={s} tone="brand">
                      {s}
                    </Badge>
                  ))}
                </div>
                {(p.url || p.repositoryUrl) && (
                  <div className="mt-3 flex gap-4">
                    {[p.url && ["Voir le projet", p.url], p.repositoryUrl && ["Dépôt", p.repositoryUrl]]
                      .filter((l): l is string[] => Boolean(l))
                      .map(([label, href]) => (
                        <a
                          key={href}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand inline-flex items-center gap-1 text-sm font-medium hover:underline"
                        >
                          {label} <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      ))}
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      );

    case "recommendations":
      return passport.recommendations.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Aucune recommandation pour l'instant"
          description="Les recommandations de collègues et clients s'afficheront ici."
        />
      ) : (
        <ul className="space-y-4">
          {passport.recommendations.map((r) => (
            <li key={r.id}>
              <Card className="p-5">
                <blockquote className="text-sm leading-relaxed">{r.content}</blockquote>
                <p className="mt-3 text-sm font-semibold">
                  {r.authorName}
                  {r.authorTitle && <span className="text-muted font-normal"> · {r.authorTitle}</span>}
                </p>
                {r.skillName && <p className="text-muted text-xs">À propos de {r.skillName}</p>}
              </Card>
            </li>
          ))}
        </ul>
      );
  }
}
