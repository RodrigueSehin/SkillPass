import type { Metadata } from "next";
import { AccountSettingsLayout, parseAccountTab } from "@/components/account/settings-layout";
import { DangerTab } from "@/components/account/danger-tab";
import { GeneralTab } from "@/components/account/general-tab";
import { IntegrationsTab } from "@/components/account/integrations-tab";
import { NotificationsTab } from "@/components/account/notifications-tab";
import { PrivacyTab } from "@/components/account/privacy-tab";
import { PublicProfileTab } from "@/components/account/public-tab";
import { SecurityTab } from "@/components/account/security-tab";
import { requireUser } from "@/lib/auth/current-user";
import { isSupabaseConfigured } from "@/lib/auth/env";
import { getProfileAccountService } from "@/services/container";

export const metadata: Metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: PageProps<"/dashboard/settings">) {
  const user = await requireUser();
  const raw = await searchParams;
  const tab = parseAccountTab(Array.isArray(raw.tab) ? raw.tab[0] : raw.tab);
  const profile = await getProfileAccountService().get(user);

  return (
    <AccountSettingsLayout tab={tab}>
      {tab === "general" && <GeneralTab profile={profile} email={user.email} />}
      {tab === "security" && <SecurityTab canChange={isSupabaseConfigured()} />}
      {tab === "notifications" && <NotificationsTab initial={profile.settings.notifications} />}
      {tab === "integrations" && <IntegrationsTab />}
      {tab === "public" && <PublicProfileTab profile={profile} />}
      {tab === "privacy" && <PrivacyTab profile={profile} />}
      {tab === "danger" && <DangerTab profile={profile} />}
    </AccountSettingsLayout>
  );
}
