import type { Metadata } from "next";
import { EvaluationWizard } from "@/components/business/evaluation-wizard";
import { NoAccess } from "@/components/business/ui";
import { EVALUATION_TEMPLATES, templateInput } from "@/config/evaluation-templates";
import { requireBusiness } from "@/lib/business/context";
import { appUrl } from "@/lib/utils/app-url";

export const metadata: Metadata = { title: "Créer une évaluation" };
export const dynamic = "force-dynamic";

export default async function NewEvaluationPage({
  searchParams,
}: PageProps<"/business/evaluations/nouvelle">) {
  const ctx = await requireBusiness();
  if (!ctx.can("evaluations.create")) return <NoAccess what="de créer des évaluations" />;
  const raw = await searchParams;
  const id = Array.isArray(raw.modele) ? raw.modele[0] : raw.modele;
  const found = EVALUATION_TEMPLATES.find((t) => t.id === id);
  const template = found ? templateInput(found, () => crypto.randomUUID()) : undefined;
  return <EvaluationWizard template={template} origin={appUrl()} />;
}
