import Image from "next/image";
import {
  AppWindow,
  BadgeCheck,
  BarChart3,
  Database,
  FolderKanban,
  Medal,
  Sparkles,
  Workflow,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { LogoMark } from "@/components/layout/logo";
import { cn } from "@/lib/utils/cn";

const PHOTOS = [
  { src: "/images/hero-talent.png", alt: "Un professionnel souriant, ordinateur sous le bras" },
  { src: "/images/hero-office.png", alt: "Deux collègues qui travaillent ensemble devant un ordinateur" },
] as const;

/** The two photos crossfade endlessly (pure CSS, see .hero-photo in globals.css). */
function Portrait() {
  return (
    <>
      {PHOTOS.map(({ src, alt }, i) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          priority={i === 0}
          sizes="(min-width: 1024px) 560px, 80vw"
          className={cn("hero-photo object-cover object-[50%_20%]", i === 1 && "hero-photo-alt")}
        />
      ))}
    </>
  );
}

const APPS = [
  { label: "Power Apps", icon: AppWindow, tile: "bg-fuchsia-100 text-fuchsia-700" },
  { label: "Power Automate", icon: Workflow, tile: "bg-blue-100 text-blue-700" },
  { label: "Power BI", icon: BarChart3, tile: "bg-amber-100 text-amber-600" },
  { label: "Dataverse", icon: Database, tile: "bg-emerald-100 text-emerald-700" },
] as const;

export function PassCard({ className }: { className?: string }) {
  return (
    <article
      aria-label="Aperçu d'un SkillPass"
      className={cn("shadow-lift rounded-2xl bg-white p-4", className)}
    >
      <div className="text-navy flex items-center gap-2">
        <LogoMark className="h-7" />
        <span className="font-bold">
          Skill<span className="text-brand">Pass</span>
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="bg-navy flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
          SR
        </span>
        <div className="min-w-0">
          <p className="text-navy truncate text-sm font-bold">Sehin G. Rodrigue</p>
          <p className="text-muted truncate text-xs">Power Platform Developer</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            role="img"
            aria-label="Score SkillPass : 87 sur 100"
            className="score-ring relative flex size-16 items-center justify-center rounded-full"
            style={{ "--ring": 87 } as React.CSSProperties}
          >
            <span className="flex size-[3.4rem] flex-col items-center justify-center rounded-full bg-white leading-none">
              <span className="text-navy text-lg font-bold">87</span>
              <span className="text-muted text-[9px]">/100</span>
            </span>
          </div>
          <div className="text-success space-y-1.5 text-[11px] font-semibold">
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5">
              <Medal className="size-3" aria-hidden /> Vérifiés
            </span>
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5">
              <BadgeCheck className="size-3" aria-hidden /> Vérifié
            </span>
          </div>
        </div>
        <QRCodeSVG
          value="https://skillpass.com/verify/SP-9F82A1"
          size={56}
          fgColor="#011E50"
          level="M"
          title="QR code d'exemple"
        />
      </div>
      <dl className="border-border mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
        {[
          { icon: Sparkles, value: 18, label: "Compétences" },
          { icon: FolderKanban, value: 12, label: "Projets" },
          { icon: Medal, value: 7, label: "Certifications" },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label}>
            <dt className="sr-only">{label}</dt>
            <dd className="flex flex-col items-center gap-0.5">
              <Icon className="text-brand size-3.5" aria-hidden />
              <span className="text-navy text-sm font-bold">{value}</span>
              <span className="text-muted text-[10px]">{label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

/** Right-hand side of the hero. Stacked on phones, floating composition from `sm` up. */
export function HeroVisual() {
  return (
    <div className="animate-pop-in relative w-full" style={{ animationDelay: "250ms" }}>
      {/* Phones: portrait, technology chips, then the card — nothing overlaps. */}
      <div className="flex flex-col items-center gap-5 sm:hidden">
        <div className="relative h-56 w-full max-w-[16rem] overflow-hidden rounded-[2rem] bg-blue-100/70">
          <Portrait />
        </div>
        <ul aria-label="Technologies" className="flex flex-wrap justify-center gap-2">
          {APPS.map(({ label, icon: Icon, tile }) => (
            <li
              key={label}
              className="shadow-soft flex items-center gap-2 rounded-full bg-white py-1.5 pr-3.5 pl-1.5"
            >
              <span className={cn("flex size-7 items-center justify-center rounded-full", tile)}>
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-navy text-xs font-semibold">{label}</span>
            </li>
          ))}
        </ul>
        <PassCard className="w-full max-w-sm" />
      </div>

      {/* Tablet and desktop: the floating composition from the mockup. */}
      <div className="relative mx-auto hidden h-[520px] w-full max-w-[600px] sm:block lg:mx-0 lg:max-w-none">
        <div aria-hidden className="absolute top-8 right-4 h-[78%] w-[72%] rounded-[3rem] bg-blue-100/70" />
        <div
          aria-hidden
          className="from-brand to-navy absolute top-[54%] right-[26%] h-24 w-40 rotate-[-35deg] rounded-3xl bg-gradient-to-br opacity-90"
        />
        <div aria-hidden className="absolute bottom-10 left-1/4 size-64 rounded-full bg-blue-50 blur-2xl" />

        <div className="hero-fade-left absolute top-2 bottom-0 left-0 w-[68%] overflow-hidden rounded-r-[3rem]">
          <Portrait />
        </div>

        <ul aria-label="Technologies" className="absolute top-6 left-2 space-y-2">
          {APPS.map(({ label, icon: Icon, tile }, i) => (
            <li
              key={label}
              style={{ animationDelay: `${-i * 1.4}s` }}
              className={cn(
                "shadow-lift flex w-40 -rotate-[8deg] items-center gap-3 rounded-2xl bg-white px-3 py-2.5",
                i % 2 === 1 && "translate-x-4",
              )}
            >
              <span className={cn("flex size-9 items-center justify-center rounded-xl", tile)}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-navy text-sm font-semibold">{label}</span>
            </li>
          ))}
        </ul>

        <p
          aria-hidden
          className="text-navy absolute top-3 right-0 max-w-[11rem] -rotate-[8deg] text-right text-2xl leading-tight sm:text-3xl"
          style={{ fontFamily: "var(--font-script), cursive", animationDelay: "900ms" }}
        >
          Vos compétences ont de la valeur !
          <svg viewBox="0 0 160 14" className="text-accent mt-1 ml-auto w-36" fill="none">
            <path d="M2 10C40 2 100 2 158 6" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </p>

        <PassCard className="animate-float-slow absolute right-0 bottom-2 w-[16.5rem] sm:w-[18rem]" />
      </div>
    </div>
  );
}
