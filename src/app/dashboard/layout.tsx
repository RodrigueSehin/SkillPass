import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireUser } from "@/lib/auth/current-user";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { profileFor } from "@/lib/auth/profile";
import { getOrganizationService } from "@/services/container";
import { REVIEWER_ROLES, ROLE_LABELS } from "@/types/profile";

export default async function DashboardRootLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const profile = await profileFor(user);
  // A role in a company adds "Organisation" to the menu. A failed lookup must never break the dashboard.
  const hasOrganization = await getOrganizationService()
    .scopeFor(profile.id)
    .then(Boolean)
    .catch(() => false);
  return (
    <DashboardLayout
      plan={profile.plan}
      user={{
        name: profile.fullName,
        roleLabel: ROLE_LABELS[profile.role],
        canReview: REVIEWER_ROLES.includes(profile.role),
        avatar: profile.avatar,
        profileId: profile.id,
        hasOrganization,
        isPlatformAdmin: isPlatformAdmin(profile),
      }}
    >
      {children}
    </DashboardLayout>
  );
}
