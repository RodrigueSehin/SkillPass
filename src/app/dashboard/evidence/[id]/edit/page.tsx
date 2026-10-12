import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EvidenceWizard } from "@/components/evidence/wizard/evidence-wizard";
import { requireUser } from "@/lib/auth/current-user";
import { getEvidenceService, getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Modifier la preuve" };

export default async function EditEvidencePage({ params }: PageProps<"/dashboard/evidence/[id]/edit">) {
  const user = await requireUser();
  const { id } = await params;
  const [all, skills] = await Promise.all([
    getEvidenceService().list(user.id),
    getSkillService().list(user.id, { sort: "name" }),
  ]);
  const evidence = all.find((e) => e.id === id);
  if (!evidence) notFound();

  return (
    <EvidenceWizard
      key={evidence.id}
      skills={skills.items.map((s) => ({ id: s.id, name: s.name }))}
      evidence={evidence}
    />
  );
}
