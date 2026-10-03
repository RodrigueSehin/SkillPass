import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { BadgeCheck, GraduationCap, Search, Users } from "lucide-react";
import { CredentialBadge } from "@/components/verification/credential-badge";
import { cn } from "@/lib/utils/cn";
import { Carousel, type CarouselSlide } from "./carousel";
import { PassCard } from "./hero-visual";
import { Reveal } from "./reveal";

const EXTENSIONS = ["webp", "jpg", "png"] as const;

/**
 * public/images/slides/slide-1.(webp|jpg|png) … slide-3: a photo dropped there replaces the
 * illustrated scene of the matching slide. No code change needed.
 */
function findSlidePhoto(n: number) {
  const dir = path.join(process.cwd(), "public", "images", "slides");
  const file = EXTENSIONS.map((ext) => `slide-${n}.${ext}`).find((f) => fs.existsSync(path.join(dir, f)));
  return file ? `/images/slides/${file}` : null;
}

function Photo({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 1024px) 560px, 90vw"
      className="shadow-lift rounded-3xl object-cover"
    />
  );
}

const Blob = ({ className }: { className?: string }) => (
  <div aria-hidden className={cn("absolute rounded-full blur-2xl", className)} />
);

function TalentScene() {
  return (
    <div
      className="relative h-full"
      role="img"
      aria-label="Aperçu d'un SkillPass avec son score et ses badges"
    >
      <Blob className="top-4 right-4 size-56 bg-blue-400/30" />
      <Blob className="bottom-0 left-4 size-44 bg-amber-300/25" />
      <PassCard className="animate-float-slow absolute top-1/2 left-1/2 w-[17rem] -translate-x-1/2 -translate-y-1/2 -rotate-3 sm:w-[19rem]" />
      <span className="animate-float text-navy shadow-lift absolute top-3 left-0 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold sm:left-4">
        <BadgeCheck className="text-success size-4" aria-hidden /> Power Apps · Avancé
      </span>
      <span
        className="animate-float text-navy shadow-lift absolute right-0 bottom-4 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold sm:right-4"
        style={{ animationDelay: "-3s" }}
      >
        <BadgeCheck className="text-success size-4" aria-hidden /> PL-200 vérifiée
      </span>
    </div>
  );
}

const CANDIDATES = [
  { initials: "SR", name: "Sehin G. Rodrigue", role: "Power Platform Developer", match: 92 },
  { initials: "AK", name: "Awa Koné", role: "Consultante Dataverse", match: 85 },
  { initials: "JY", name: "Jean-Marc Yao", role: "Développeur Power Apps", match: 78 },
] as const;

function CompanyScene() {
  return (
    <div
      className="relative h-full"
      role="img"
      aria-label="Aperçu d'une recherche de talents avec des scores d'adéquation"
    >
      <Blob className="top-0 left-6 size-56 bg-blue-400/30" />
      <div className="animate-float-slow text-navy shadow-lift absolute top-1/2 left-1/2 w-[92%] max-w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-4">
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
          <Search className="text-brand size-4" aria-hidden />
          <span className="truncate">Power Apps · Expert · Abidjan · 3+ ans</span>
        </div>
        <ul className="mt-3 space-y-2.5">
          {CANDIDATES.map((c) => (
            <li key={c.name} className="border-border flex items-center gap-3 rounded-xl border p-2.5">
              <span className="bg-navy flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                {c.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{c.name}</p>
                <p className="text-muted truncate text-[11px]">{c.role}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="bg-success h-full rounded-full" style={{ width: `${c.match}%` }} />
                </div>
              </div>
              <span className="text-success text-sm font-bold">{c.match}%</span>
            </li>
          ))}
        </ul>
      </div>
      <span className="animate-float text-navy shadow-lift absolute top-2 right-0 flex items-center gap-2 rounded-2xl bg-amber-300 px-3 py-2 text-xs font-bold sm:right-4">
        <Users className="size-4" aria-hidden /> 126 correspondances
      </span>
    </div>
  );
}

function AcademyScene() {
  return (
    <div
      className="relative h-full"
      role="img"
      aria-label="Aperçu d'un badge vérifiable délivré par une académie"
    >
      <Blob className="right-2 bottom-2 size-56 bg-amber-300/25" />
      <Blob className="top-2 left-6 size-48 bg-blue-400/30" />
      <div className="animate-float-slow absolute top-1/2 left-1/2 w-[92%] max-w-[24rem] -translate-x-1/2 -translate-y-1/2 rotate-2">
        <CredentialBadge
          credential={{
            credentialId: "SP-9F82A1",
            skillName: "Power Platform Fundamentals",
            level: "ADVANCED",
            issuer: "Académie Digitale",
            issuedAt: "2026-06-12T00:00:00.000Z",
            expiresAt: "2030-06-12T00:00:00.000Z",
            status: "VALID",
          }}
          verifyUrl="https://skillpass.com/verify/SP-9F82A1"
        />
      </div>
      <span className="animate-float text-navy shadow-lift absolute bottom-3 left-0 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold sm:left-4">
        <GraduationCap className="text-brand size-4" aria-hidden /> Promotion 2026 · 128 diplômés
      </span>
    </div>
  );
}

export function AudienceCarousel() {
  const slides: CarouselSlide[] = [
    {
      id: "talents",
      kicker: "Pour les talents",
      title: "Transformez vos compétences en preuves",
      text: "Projets, certifications, évaluations : construisez un passeport que les recruteurs vérifient en un scan.",
      points: [
        "Passeport public partageable",
        "Badges et credentials vérifiables",
        "Opportunités qui vous correspondent",
      ],
      cta: { label: "Créer mon SkillPass", href: "/register" },
      visual: findSlidePhoto(1) ? (
        <Photo src={findSlidePhoto(1)!} alt="Un talent présentant son SkillPass" />
      ) : (
        <TalentScene />
      ),
    },
    {
      id: "entreprises",
      kicker: "Pour les entreprises",
      title: "Recrutez sur preuves, pas sur promesses",
      text: "Recherchez par compétences vérifiées, comparez les profils et mesurez l'adéquation avec vos besoins.",
      points: [
        "Recherche par compétences prouvées",
        "Matching et analyse des écarts",
        "Vérification instantanée des credentials",
      ],
      cta: { label: "Créer mon compte", href: "/register" },
      visual: findSlidePhoto(2) ? (
        <Photo src={findSlidePhoto(2)!} alt="Une équipe de recrutement examinant des profils" />
      ) : (
        <CompanyScene />
      ),
    },
    {
      id: "academies",
      kicker: "Pour les académies",
      title: "Donnez de la valeur à vos formations",
      text: "Délivrez des badges et certifications vérifiables et suivez l'insertion professionnelle de vos apprenants.",
      points: [
        "Émission de badges et certifications",
        "Suivi des cohortes",
        "Insertion professionnelle mesurable",
      ],
      cta: { label: "Créer mon compte", href: "/register" },
      visual: findSlidePhoto(3) ? (
        <Photo src={findSlidePhoto(3)!} alt="Des apprenants recevant leur certification" />
      ) : (
        <AcademyScene />
      ),
    },
  ];

  return (
    <section id="audiences" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-brand mb-3 flex items-center justify-center gap-2 text-sm font-semibold">
            <span aria-hidden className="bg-accent h-0.5 w-6 rounded-full" /> Pour tous
          </p>
          <h2 className="text-navy text-3xl font-extrabold tracking-tight sm:text-4xl">
            Un produit, trois publics
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <Carousel
            slides={slides}
            label="Ce que SkillPass apporte aux talents, aux entreprises et aux académies"
          />
        </Reveal>
      </div>
    </section>
  );
}
