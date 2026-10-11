import type { Metadata } from "next";
import { EvidenceWizard } from "@/components/evidence/wizard/evidence-wizard";
import { requireUser } from "@/lib/auth/current-user";
import { getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Ajouter une preuve" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function NewEvidencePage({ searchParams }: PageProps<"/dashboard/evidence/new">) {
  const user = await requireUser();
  const skillId = first((await searchParams).skill);
  const skills = await getSkillService().list(user.id, { sort: "name" });

  return (
    <EvidenceWizard
      key={skillId ?? ""}
      skills={skills.items.map((s) => ({ id: s.id, name: s.name }))}
      initialSkillId={skillId}
    />
  );
}
