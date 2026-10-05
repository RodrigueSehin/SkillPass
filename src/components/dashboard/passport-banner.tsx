import Link from "next/link";
import { ArrowRight, BadgeCheck, FolderKanban, Medal, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { LogoMark } from "@/components/layout/logo";

interface PassportBannerProps {
  name: string;
  headline: string | null;
  score: number;
  verified: boolean;
  publicUrl: string;
  counts: { skills: number; projects: number; certifications: number };
}

/** Dark call-to-action banner with a miniature of the user's own SkillPass. */
export function PassportBanner({ name, headline, score, verified, publicUrl, counts }: PassportBannerProps) {
  return (
    <section
      aria-labelledby="passport-banner-title"
      className="shadow-soft relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1d4d] via-[#0f2f7a] to-[#1746b5] p-6 text-white sm:p-8"
    >
      <div aria-hidden className="absolute -top-16 -right-10 size-64 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div className="max-w-sm">
          <h2 id="passport-banner-title" className="text-xl leading-tight font-bold sm:text-2xl">
            Votre passeport numérique des compétences
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-blue-100">
            Un profil vérifié, des compétences avérées, des opportunités réelles.
          </p>
          <Link
            href="/dashboard/skillpass"
            className="text-navy shadow-soft mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-blue-50"
          >
            Voir mon SkillPass <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <article
          aria-label="Aperçu de votre SkillPass"
          className="text-navy shadow-lift w-full max-w-[15rem] rotate-3 justify-self-center rounded-2xl bg-white p-4 md:justify-self-end"
        >
          <div className="flex items-center gap-2">
            <LogoMark className="h-6" />
            <span className="text-sm font-bold">
              Skill<span className="text-brand">Pass</span>
            </span>
          </div>
          <div className="mt-3 min-w-0">
            <p className="truncate text-sm font-bold">{name}</p>
            {headline && <p className="text-muted truncate text-xs">{headline}</p>}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                role="img"
                aria-label={`Score SkillPass : ${score} sur 100`}
                className="score-ring flex size-14 items-center justify-center rounded-full"
                style={{ "--ring": score } as React.CSSProperties}
              >
                <span className="flex size-[2.9rem] flex-col items-center justify-center rounded-full bg-white leading-none">
                  <span className="text-base font-bold">{score}</span>
                  <span className="text-muted text-[8px]">/100</span>
                </span>
              </div>
              {verified && (
                <span className="text-success flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold">
                  <BadgeCheck className="size-3" aria-hidden /> Vérifié
                </span>
              )}
            </div>
            <QRCodeSVG
              value={publicUrl}
              size={52}
              fgColor="#172554"
              level="M"
              title="QR code de votre profil"
            />
          </div>
          <dl className="border-border mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
            {[
              { icon: Sparkles, value: counts.skills, label: "Compétences" },
              { icon: FolderKanban, value: counts.projects, label: "Projets" },
              { icon: Medal, value: counts.certifications, label: "Certifications" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="flex flex-col items-center">
                  <Icon className="text-brand size-3.5" aria-hidden />
                  <span className="text-sm font-bold">{value}</span>
                  <span className="text-muted text-[9px]">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </article>
      </div>
    </section>
  );
}
