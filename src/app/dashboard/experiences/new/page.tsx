import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BriefcaseMedical, ChevronRight } from "lucide-react";
import { NewExperienceForm } from "@/components/experiences/new-experience-form";
import { requireUser } from "@/lib/auth/current-user";
import { DOMAIN_IDEAS } from "@/lib/experience-options";
import { getExperienceService, getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Ajouter une expérience" };

const unique = (values: (string | null)[]) => [...new Set(values.filter((v): v is string => Boolean(v)))];

export default async function NewExperiencePage() {
  const user = await requireUser();
  const [experiences, skills] = await Promise.all([
    getExperienceService().list(user.id),
    getSkillService().list(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/experiences"
            className="text-muted hover:text-brand inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden /> Retour aux expériences
          </Link>
          <h1 className="text-navy mt-3 flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            <BriefcaseMedical className="text-brand size-9" aria-hidden /> Ajouter une expérience
            professionnelle
          </h1>
          <p className="text-muted mt-1">
            Partagez votre parcours et mettez en valeur votre expérience pour attirer plus
            d&apos;opportunités.
          </p>
        </div>
        <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
          <Link href="/dashboard/experiences" className="hover:text-brand">
            Expériences
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span aria-current="page">Ajouter une expérience</span>
        </nav>
      </div>

      <NewExperienceForm
        companies={unique(experiences.map((e) => e.company))}
        locations={unique(experiences.map((e) => e.location))}
        domains={unique([...experiences.map((e) => e.domain), ...DOMAIN_IDEAS])}
        skillNames={skills.items.map((s) => s.name)}
      />
    </div>
  );
}
