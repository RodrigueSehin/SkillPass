import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileUp } from "lucide-react";
import { CvImport } from "@/components/cv/cv-import";
import { requireUser } from "@/lib/auth/current-user";
import { getAIService } from "@/services/container";

export const metadata: Metadata = { title: "Importer mon CV" };

export default async function ImportCvPage() {
  await requireUser();
  // Without an API key the feature does not exist: the page is a plain 404, like the Business pages a plan lacks.
  if (!getAIService().enabled) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/skills"
          className="text-muted hover:text-brand inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden /> Retour aux compétences
        </Link>
        <h1 className="text-navy mt-3 flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
          <FileUp className="text-brand size-8" aria-hidden /> Importer mon CV
        </h1>
        <p className="text-muted mt-1">
          Gagnez du temps : l&apos;assistant propose vos compétences, expériences et certifications à partir
          de votre CV. Rien n&apos;est ajouté sans votre accord.
        </p>
      </div>
      <CvImport />
    </div>
  );
}
