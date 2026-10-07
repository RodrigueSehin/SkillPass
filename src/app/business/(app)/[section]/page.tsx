import { notFound } from "next/navigation";
import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { BUSINESS_NAV, BUSINESS_PLACEHOLDERS, BUSINESS_SECONDARY_NAV } from "@/config/business-navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return BUSINESS_PLACEHOLDERS.map((section) => ({ section }));
}

/** Sections that ship in a later step. Specific routes take precedence over this one. */
export default async function BusinessSectionPage({ params }: PageProps<"/business/[section]">) {
  const { section } = await params;
  const item = [...BUSINESS_NAV, ...BUSINESS_SECONDARY_NAV].find((n) => n.href === `/business/${section}`);
  if (!item) notFound();
  return (
    <>
      <PageHeader title={item.label} />
      <EmptyState
        icon={Hammer}
        title="Bientôt disponible"
        description="Cette section de SkillPass Business arrive dans la prochaine étape."
      />
    </>
  );
}
