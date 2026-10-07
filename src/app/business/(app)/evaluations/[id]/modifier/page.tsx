import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EvaluationWizard } from "@/components/business/evaluation-wizard";
import { NoAccess } from "@/components/business/ui";
import { requireBusiness } from "@/lib/business/context";
import { NotFoundError } from "@/lib/errors";
import { getEvaluationService } from "@/services/container";

export const metadata: Metadata = { title: "Modifier l'évaluation" };
export const dynamic = "force-dynamic";

export default async function EditEvaluationPage({
  params,
}: PageProps<"/business/evaluations/[id]/modifier">) {
  const ctx = await requireBusiness();
  if (!ctx.can("evaluations.edit")) return <NoAccess what="de modifier des évaluations" />;
  const { id } = await params;
  let evaluation;
  try {
    evaluation = await getEvaluationService().get(ctx.organization.id, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return <EvaluationWizard evaluation={evaluation} origin={`${proto}://${host}`} />;
}
