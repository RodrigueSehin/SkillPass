import { LockKeyhole } from "lucide-react";
import { BusinessMobileNav, BusinessSidebar, BusinessTopbar } from "@/components/business/business-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { requireBusiness } from "@/lib/business/context";
import { PLANS } from "@/lib/business/plans";
import { getOrganizationService } from "@/services/container";
import { ORG_ROLE_LABELS } from "@/types/business";
import { DEFAULT_BRANDING, type BrandingSettings } from "@/types/org-settings";

/** The organization's colours replace the product tokens inside the Business shell only. */
function brandingStyle(branding: BrandingSettings) {
  if (
    branding.primary === DEFAULT_BRANDING.primary &&
    branding.secondary === DEFAULT_BRANDING.secondary &&
    branding.accent === DEFAULT_BRANDING.accent
  ) {
    return undefined;
  }
  return {
    "--navy": branding.primary,
    "--accent": branding.secondary,
    "--brand": branding.accent,
    "--sidebar-from": `color-mix(in srgb, ${branding.primary} 70%, black)`,
    "--sidebar-to": branding.primary,
  } as React.CSSProperties;
}

export default async function BusinessAppLayout({ children }: LayoutProps<"/business">) {
  const ctx = await requireBusiness();
  const service = getOrganizationService();
  await service.touch(ctx);
  const members = await service.listMembers(ctx.organization.id);

  const { branding } = ctx.organization.settings;
  return (
    <div
      className="to-background min-h-screen bg-gradient-to-b from-[#f3f7ff]"
      style={brandingStyle(branding)}
    >
      <BusinessSidebar planName={PLANS[ctx.organization.plan].name} plan={ctx.organization.plan} />
      <div className="lg:pl-60">
        <BusinessTopbar
          organizationName={ctx.organization.name}
          roleLabel={ORG_ROLE_LABELS[ctx.member.role]}
          logoVersion={ctx.organization.logoVersion}
          pendingInvites={members.filter((m) => m.status === "INVITED").length}
          showLogo={branding.showLogo}
          showName={branding.showName}
          platformAdmin={ctx.platformAdmin}
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
