import fs from "node:fs";
import path from "node:path";
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

const PHOTO_CANDIDATES = ["hero-talent.webp", "hero-talent.png", "hero-talent.jpg"] as const;

/** A photo dropped in public/images/ replaces the illustration: no code change needed. */
function findHeroPhoto() {
  const dir = path.join(process.cwd(), "public", "images");
  return PHOTO_CANDIDATES.find((file) => fs.existsSync(path.join(dir, file)));
}

/** Flat portrait used until a real photo is provided. */
function TalentIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 520"
      className={className}
      role="img"
      aria-label="Illustration d'un professionnel souriant"
    >
      {/* Jacket and shirt */}
      <path d="M10 520C10 405 78 352 200 342c122 10 190 63 190 178Z" fill="#172554" />
      <path d="M148 344 200 452l52-108-26-14h-52Z" fill="#FFFFFF" />
      <path d="M148 344 118 360l82 100-6-14Z" fill="#0F1D45" />
      <path d="M252 344l30 16-82 100 6-14Z" fill="#0F1D45" />
      {/* Backpack strap */}
      <path d="M92 380c-10 40-14 90-12 140h34c-2-48 4-92 20-134Z" fill="#0B1533" />
      {/* Neck and head */}
      <rect x="172" y="285" width="56" height="70" rx="24" fill="#7A4A2E" />
      <ellipse cx="200" cy="212" rx="68" ry="82" fill="#8B5A3C" />
      <ellipse cx="133" cy="218" rx="10" ry="18" fill="#7A4A2E" />
      <ellipse cx="267" cy="218" rx="10" ry="18" fill="#7A4A2E" />
      {/* Hair */}
      <path d="M131 196c-4-70 38-98 69-98s73 28 69 98c-12-40-40-56-69-56s-57 16-69 56Z" fill="#14110F" />
      {/* Glasses */}
      <rect x="146" y="196" width="50" height="38" rx="15" fill="none" stroke="#0B0B0B" strokeWidth="5" />
      <rect x="204" y="196" width="50" height="38" rx="15" fill="none" stroke="#0B0B0B" strokeWidth="5" />
      <path d="M196 213h8" stroke="#0B0B0B" strokeWidth="5" />
      <circle cx="171" cy="215" r="4.5" fill="#14110F" />
      <circle cx="229" cy="215" r="4.5" fill="#14110F" />
      {/* Smile */}
      <path d="M170 258c18 22 42 22 60 0-6 8-14 20-30 20s-24-12-30-20Z" fill="#FFFFFF" />
      <path
        d="M170 258c18 22 42 22 60 0"
        fill="none"
        stroke="#4A2A18"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Portrait({ className }: { className?: string }) {
  const photo = findHeroPhoto();
  return photo ? (
    <Image
      src={`/images/${photo}`}
      alt="Un professionnel souriant, ordinateur sous le bras"
      fill
      priority
      sizes="(min-width: 1024px) 420px, 70vw"
      className={cn("object-contain object-bottom", className)}
    />
  ) : (
    <TalentIllustration className={cn("h-full w-full", className)} />
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
          fgColor="#172554"
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
        <div className="relative h-56 w-full max-w-[16rem] rounded-[2rem] bg-blue-100/70">
          <Portrait className="px-6" />
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

        <div className="absolute top-2 bottom-0 left-[18%] w-[50%]">
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
