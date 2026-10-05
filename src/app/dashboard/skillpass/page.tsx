import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PassportView, parseTab } from "@/components/profile/passport-view";
import { ShareButton } from "@/components/profile/share-button";
import { requireUser } from "@/lib/auth/current-user";
import { appUrl } from "@/lib/utils/app-url";
import { profileFor } from "@/lib/auth/profile";
import { getPassportService } from "@/services/container";

export const metadata: Metadata = { title: "Mon SkillPass" };

export default async function MySkillPassPage({ searchParams }: PageProps<"/dashboard/skillpass">) {
  const user = await requireUser();
  const profile = await profileFor(user);
  const passport = await getPassportService().build(user.id, profile);
  const publicUrl = `${appUrl()}/${profile.username}`;

  return (
    <PassportView
      profile={profile}
      passport={passport}
      tab={parseTab((await searchParams).tab)}
      basePath="/dashboard/skillpass"
      publicUrl={publicUrl}
      actions={
        <>
          <ShareButton url={publicUrl} title={`${profile.fullName} — SkillPass`} />
          <Button asChild variant="outline">
            <Link href={`/${profile.username}`} target="_blank">
              <ExternalLink /> Voir mon profil public
            </Link>
          </Button>
        </>
      }
    />
  );
}
