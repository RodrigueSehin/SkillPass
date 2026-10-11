import { requireTalentFeature } from "@/lib/plans/talent-guard";

/** Every assessment page needs the "Évaluations" feature of the Pro plan. */
export default async function AssessmentsLayout({ children }: LayoutProps<"/dashboard/assessments">) {
  await requireTalentFeature("assessments");
  return children;
}
