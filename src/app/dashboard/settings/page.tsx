import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { requireUser } from "@/lib/auth/current-user";
import { getProfileAccountService } from "@/services/container";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfileAccountService().get(user);
  return (
    <>
      <PageHeader title="Paramètres" description="Votre profil professionnel et sa visibilité." />
      <ProfileSettingsForm profile={profile} />
    </>
  );
}
