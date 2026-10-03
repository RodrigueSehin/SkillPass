import Link from "next/link";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { QRCodeCard } from "@/components/skills/qr-code-card";
import { SkillPassScore } from "@/components/skills/skillpass-score";
import { SkillProgress } from "@/components/skills/skill-progress";
import { StatCard } from "@/components/skills/stat-card";
import { VerificationBadge } from "@/components/skills/verification-badge";
import { formatMonth, formatPeriod } from "@/lib/utils/format";
import type { Passport } from "@/services/passport.service";
import { AVAILABILITY_LABELS, type PublicProfileDTO } from "@/types/profile";
import { VERIFICATION_STATUS_LABELS } from "@/types/skill";
import { CredentialBadge } from "@/components/verification/credential-badge";
import { appUrl } from "@/lib/utils/app-url";
import { ScoreBreakdown } from "./score-breakdown";

export const PASSPORT_TABS = [
  ["overview", "Vue d'ensemble"],
  ["skills", "Compétences"],
  ["certifications", "Certifications"],
  ["experiences", "Expériences"],
  ["projects", "Projets"],
  ["portfolio", "Portfolio"],
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="size-20 text-xl">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight">
                {profile.fullName}
                {passport.isVerified && (
                  <Badge tone="success">
                    <BadgeCheck className="size-3.5" aria-hidden /> Verified
                  </Badge>
                )}
              </h1>
              {profile.headline && <p className="text-muted mt-1">{profile.headline}</p>}
              <p className="text-muted mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-4" aria-hidden /> {profile.location}
                  </span>
                )}
                <span>{AVAILABILITY_LABELS[profile.availability]}</span>
              </p>
              {actions && <div className="mt-4 flex flex-wrap gap-3">{actions}</div>}
            </div>
          </div>
          <div className="flex items-center justify-between gap-6 sm:justify-start">
            <SkillPassScore score={passport.score.total} verified={passport.isVerified} size={132} />
            <QRCodeCard url={publicUrl} label="Scannez pour vérifier" />
          </div>
        </CardContent>
      </Card>

      <section aria-label="Indicateurs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Compétences" value={stats.skills} icon={Sparkles} />
        <StatCard label="Vérifiées" value={stats.verifiedSkills} icon={BadgeCheck} />
        <StatCard label="Projets" value={stats.projects} icon={FolderKanban} />
        <StatCard label="Certifications" value={stats.certifications} icon={Award} />
        <StatCard label="Recommandations" value={stats.recommendations} icon={MessageSquareQuote} />
      </section>

      <nav aria-label="Sections du SkillPass" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="border-border flex min-w-max gap-1 border-b">
          {PASSPORT_TABS.map(([key, label]) => (
            <li key={key}>
              <Link
                href={key === "overview" ? basePath : `${basePath}?tab=${key}`}
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

      <TabContent tab={tab} profile={profile} passport={passport} />
    </div>
  );
}

function TabContent({
  tab,
  profile,
  passport,
}: {
  tab: PassportTab;
  profile: PublicProfileDTO;
  passport: Passport;
}) {
  switch (tab) {
    case "overview":
      return (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>À propos</CardTitle>
                </CardHeader>
                <CardContent className="text-muted pt-4 text-sm leading-relaxed">{profile.bio}</CardContent>
              </Card>
            )}
            {passport.credentials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Badges vérifiés</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {passport.credentials.slice(0, 4).map((c) => (
                    <CredentialBadge
                      key={c.credentialId}
                      credential={c}
                      verifyUrl={`${appUrl()}/verify/${c.credentialId}`}
                      showQr={false}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Top compétences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {passport.skills.length === 0 && (
                  <p className="text-muted text-sm">Aucune compétence renseignée.</p>
                )}
                {passport.skills.slice(0, 5).map((s) => (
                  <SkillProgress key={s.id} name={s.name} score={s.score} />
                ))}
              </CardContent>
            </Card>
          </div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Pourquoi ce score ?</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown score={passport.score} />
            </CardContent>
          </Card>
        </div>
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

    case "portfolio":
      return (
        <EmptyState
          icon={FolderKanban}
          title="Portfolio bientôt disponible"
          description="Les images et documents de vos projets arriveront avec les preuves."
        />
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
