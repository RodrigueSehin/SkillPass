import type { Metadata } from "next";
import { AccountSettingsLayout, parseAccountTab } from "@/components/account/settings-layout";
import { DangerTab } from "@/components/account/danger-tab";
import { GeneralTab } from "@/components/account/general-tab";
import { IntegrationsTab } from "@/components/account/integrations-tab";
import { NotificationsTab } from "@/components/account/notifications-tab";
import { PrivacyTab } from "@/components/account/privacy-tab";
import { PublicProfileTab } from "@/components/account/public-tab";
import { PlanTab } from "@/components/account/plan-tab";
import { SecurityTab } from "@/components/account/security-tab";
import { requireUser } from "@/lib/auth/current-user";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { isSupabaseConfigured } from "@/lib/auth/env";
import { getProfileAccountService, getProjectService, getSkillService } from "@/services/container";

export const metadata: Metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: PageProps<"/dashboard/settings">) {
  const user = await requireUser();
  const raw = await searchParams;
  const profile = await getProfileAccountService().get(user);
  const platformAdmin = isPlatformAdmin(profile);
  // Counted only where they are shown: the usage bars of the plan tab.
  const [skillCount, projectCount] =
    parseAccountTab(Array.isArray(raw.tab) ? raw.tab[0] : raw.tab, platformAdmin) === "plan"
      ? await Promise.all([
          getSkillService()
            .list(user.id)
            .then((r) => r.total),
          getProjectService()
            .list(user.id)
            .then((r) => r.length),
        ])
      : [0, 0];
  const tab = parseAccountTab(Array.isArray(raw.tab) ? raw.tab[0] : raw.tab, platformAdmin);

  return (
    <AccountSettingsLayout tab={tab} platformAdmin={platformAdmin}>
      {tab === "general" && <GeneralTab profile={profile} email={user.email} />}
      {tab === "plan" && (
        <PlanTab
          plan={profile.plan}
          usage={{ skills: skillCount, projects: projectCount }}
          canSwitch={process.env.NODE_ENV !== "production"}
        />
      )}
      {tab === "security" && <SecurityTab canChange={isSupabaseConfigured()} />}
      {tab === "notifications" && <NotificationsTab initial={profile.settings.notifications} />}
      {tab === "integrations" && <IntegrationsTab />}
      {tab === "public" && <PublicProfileTab profile={profile} />}
      {tab === "privacy" && <PrivacyTab profile={profile} />}
      {tab === "danger" && <DangerTab profile={profile} />}
    </AccountSettingsLayout>
  );
}
