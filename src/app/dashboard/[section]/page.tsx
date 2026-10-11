import { notFound } from "next/navigation";
import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireTalentFeature } from "@/lib/plans/talent-guard";
import { EmptyState } from "@/components/ui/empty-state";
import { DASHBOARD_NAV, DASHBOARD_SECONDARY_NAV, PLACEHOLDER_SECTIONS } from "@/config/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return PLACEHOLDER_SECTIONS.map((section) => ({ section }));
}

/** Temporary page for sections shipped in later phases. Specific routes take precedence over this one. */
export default async function SectionPlaceholderPage({ params }: PageProps<"/dashboard/[section]">) {
  const { section } = await params;
  const item = [...DASHBOARD_NAV, ...DASHBOARD_SECONDARY_NAV].find((n) => n.href === `/dashboard/${section}`);
  if (!item) notFound();
  // A section of a feature the plan lacks does not exist for this account.
  if (item.feature) await requireTalentFeature(item.feature);

  return (
    <>
      <PageHeader title={item.label} />
      <EmptyState
        icon={Hammer}
        title="Bientôt disponible"
        description="Cette section arrive dans une prochaine phase de SkillPass."
      />
    </>
  );
}
