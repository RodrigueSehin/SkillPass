import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronRight, Lightbulb, PlusSquare } from "lucide-react";
import { LevelOverview } from "@/components/skills/level-overview";
import { NewSkillForm } from "@/components/skills/new-skill-form";
import { requireUser } from "@/lib/auth/current-user";
import { getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Ajouter une compétence" };

/** Category ideas offered next to the ones the user already has. */
const CATEGORY_IDEAS = [
  "Power Platform",
  "Tech & Digital",
  "Data & Analytics",
  "AI & Automation",
  "Gestion & Business",
  "Soft Skills",
  "Langues",
  "Création & Design",
  "Transformation & Design",
];

/** Clicking one pre-fills the name (it travels in the URL, so it works without JS). */
const SUGGESTIONS = [
  "Power Apps",
  "Power Automate",
  "Dataverse",
  "Power BI",
  "SharePoint",
  "Azure",
  "SQL",
  "Python",
  "JavaScript",
  "React",
  "Analyse de données",
  "Leadership",
  "Communication",
  "Agile",
];

const REASONS = [
  "Rendez votre profil plus lisible auprès des recruteurs",
  "Valorisez votre expertise avec des preuves concrètes",
  "Faites vérifier une compétence par une évaluation",
  "Suivez votre progression dans votre SkillPass",
];

export default async function NewSkillPage({ searchParams }: PageProps<"/dashboard/skills/new">) {
  const user = await requireUser();
  const raw = (await searchParams).name;
  const name = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 60);
  const { categories, total, levels } = await getSkillService().list(user.id);
  const allCategories = [...new Set([...categories, ...CATEGORY_IDEAS])];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/skills"
            className="text-muted hover:text-brand inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden /> Retour aux compétences
          </Link>
          <h1 className="text-navy mt-3 flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            <PlusSquare className="text-brand size-8" aria-hidden /> Ajouter une compétence
          </h1>
          <p className="text-muted mt-1">
            Ajoutez une compétence à votre profil pour mettre en valeur votre savoir-faire.
          </p>
        </div>
        <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-xs">
          <Link href="/dashboard/skills" className="hover:text-brand">
            Compétences
          </Link>
          <ChevronRight className="size-3" aria-hidden />
          <span aria-current="page">Ajouter une compétence</span>
        </nav>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <NewSkillForm key={name ?? ""} defaultName={name} categories={allCategories} />

        <aside className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <section
            aria-labelledby="why-title"
            className="border-border/60 shadow-soft rounded-2xl border bg-white p-5"
          >
            <h2 id="why-title" className="text-navy flex items-center gap-2 font-bold">
              <Lightbulb className="size-5 text-amber-500" aria-hidden /> Pourquoi ajouter vos compétences ?
            </h2>
            <ul className="mt-4 space-y-3">
              {REASONS.map((r) => (
                <li key={r} className="text-navy flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" aria-hidden /> {r}
                </li>
              ))}
            </ul>
          </section>
          <LevelOverview levels={levels} total={total} />
          <section
            aria-labelledby="suggest-title"
            className="border-border/60 shadow-soft rounded-2xl border bg-white p-5 md:col-span-2 xl:col-span-1"
          >
            <h2 id="suggest-title" className="text-navy font-bold">
              Suggestions
            </h2>
            <p className="text-muted mt-1 text-xs">Cliquez pour préremplir le nom de la compétence.</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <Link
                    href={`/dashboard/skills/new?name=${encodeURIComponent(s)}`}
                    className="text-brand inline-block rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium hover:bg-blue-100"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
