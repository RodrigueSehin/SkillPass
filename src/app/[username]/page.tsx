import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { PassportView, parseTab } from "@/components/profile/passport-view";
import { ShareButton } from "@/components/profile/share-button";
import { appUrl } from "@/lib/utils/app-url";
import { getPassportService, getProfileAccountService } from "@/services/container";

/** Cheap lookup shared by metadata and page; both run per request. */
const load = (username: string) => getProfileAccountService().getPublic(username.toLowerCase());

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const found = await load(username);
  if (!found) return { title: "Profil introuvable", robots: { index: false } };

  const { profile } = found;
  const title = `${profile.fullName}${profile.headline ? ` — ${profile.headline}` : ""}`;
  const description =
    profile.bio?.slice(0, 160) ?? `Passeport de compétences vérifiable de ${profile.fullName} sur SkillPass.`;
  const canonical = `${appUrl()}/${profile.username}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "profile", title, description, url: canonical, siteName: "SkillPass" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicProfilePage({ params, searchParams }: PageProps<"/[username]">) {
  const { username } = await params;
  const found = await load(username);
  if (!found) notFound();

  const { id, profile, updatedAt } = found;
  const passport = await getPassportService().build(id, {
    yearsOfExperience: profile.yearsOfExperience,
    updatedAt,
  });
  const publicUrl = `${appUrl()}/${profile.username}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    url: publicUrl,
    jobTitle: profile.profession ?? profile.headline ?? undefined,
    description: profile.bio ?? undefined,
    address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location } : undefined,
    knowsAbout: passport.skills.filter((s) => s.verificationStatus === "VERIFIED").map((s) => s.name),
  };

  return (
    <div className="min-h-screen">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Button asChild size="sm">
            <Link href="/register">Créer mon SkillPass</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* "<" is escaped so profile text can never close the script element. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
        />
        <PassportView
          profile={profile}
          passport={passport}
          tab={parseTab((await searchParams).tab)}
          basePath={`/${profile.username}`}
          publicUrl={publicUrl}
          actions={<ShareButton url={publicUrl} title={`${profile.fullName} — SkillPass`} />}
        />
      </main>
    </div>
  );
}
