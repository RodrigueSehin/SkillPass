import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import heroPhoto from "@/assets/skills/hero.jpg";
import { AddSkillButton } from "./add-skill-button";

export function SkillsHero() {
  return (
    <section
      aria-label="Présentation"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-blue-100/70 to-blue-200/60 p-6 sm:p-8"
    >
      <div className="relative z-10 max-w-lg">
        <h2 className="text-navy text-2xl leading-tight font-extrabold sm:text-3xl">
          Chaque compétence vous rapproche de vos objectifs.
        </h2>
        <p className="text-navy/80 mt-3 text-sm sm:text-base">
          Ajoutez vos compétences, suivez votre progression, obtenez des certifications et faites la
          différence.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <AddSkillButton />
          <Link
            href="/dashboard/assessments"
            className="text-brand border-brand/40 inline-flex h-11 items-center gap-2 rounded-xl border bg-white/70 px-5 text-sm font-semibold hover:bg-white"
          >
            <ClipboardCheck className="size-4" aria-hidden /> Passer une évaluation
          </Link>
        </div>
      </div>
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-2/5 md:block">
        <Image
          src={heroPhoto}
          alt=""
          fill
          sizes="(min-width: 1280px) 360px, 280px"
          className="[mask-image:linear-gradient(to_right,transparent,black_35%)] object-cover object-top"
        />
      </div>
    </section>
  );
}
