import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireUser } from "@/lib/auth/current-user";
import { profileFor } from "@/lib/auth/profile";
import { REVIEWER_ROLES, ROLE_LABELS } from "@/types/profile";

export default async function DashboardRootLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const profile = await profileFor(user);
  return (
    <DashboardLayout
      plan={profile.plan}
      user={{
        name: profile.fullName,
        roleLabel: ROLE_LABELS[profile.role],
        canReview: REVIEWER_ROLES.includes(profile.role),
      }}
    >
      {children}
    </DashboardLayout>
  );
}
