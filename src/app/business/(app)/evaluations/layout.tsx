import { requireBusiness } from "@/lib/business/context";
import { requireBusinessFeature } from "@/lib/business/features";

/** Every evaluation page needs the "Évaluations de compétences" feature of the plan. */
export default async function EvaluationsLayout({ children }: LayoutProps<"/business/evaluations">) {
  requireBusinessFeature(await requireBusiness(), "evaluations");
  return children;
}
