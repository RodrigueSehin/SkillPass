import { LockKeyhole } from "lucide-react";
import { BusinessMobileNav, BusinessSidebar, BusinessTopbar } from "@/components/business/business-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { requireBusiness } from "@/lib/business/context";
import { PLANS } from "@/lib/business/plans";
import { getOrganizationService } from "@/services/container";
import { ORG_ROLE_LABELS } from "@/types/business";

export default async function BusinessAppLayout({ children }: LayoutProps<"/business">) {
  const ctx = await requireBusiness();
  const service = getOrganizationService();
  await service.touch(ctx);
  const members = await service.listMembers(ctx.organization.id);

  return (
    <div className="to-background min-h-screen bg-gradient-to-b from-[#f3f7ff]">
      <BusinessSidebar planName={PLANS[ctx.organization.plan].name} />
      <div className="lg:pl-60">
        <BusinessTopbar
          organizationName={ctx.organization.name}
          roleLabel={ORG_ROLE_LABELS[ctx.member.role]}
          logoVersion={ctx.organization.logoVersion}
          pendingInvites={members.filter((m) => m.status === "INVITED").length}
        />
        <main className="mx-auto max-w-[1500px] px-4 py-6 pb-24 sm:px-6 lg:pb-10">
          {ctx.member.status === "ACTIVE" ? (
            children
          ) : (
            <EmptyState
              icon={LockKeyhole}
              title="Votre accès est désactivé"
              description="Un administrateur de votre organisation a désactivé votre compte. Contactez-le pour retrouver l'accès."
            />
          )}
        </main>
      </div>
      <BusinessMobileNav />
    </div>
  );
}
