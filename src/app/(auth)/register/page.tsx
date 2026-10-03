import type { Metadata } from "next";
import Link from "next/link";
import { RegisterWizard } from "@/components/auth/register-wizard";
import { OAuthButtons, OrDivider } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = { title: "Créer mon SkillPass" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Créer mon SkillPass</h1>
      <p className="text-muted mt-2">
        Trois étapes pour construire votre identité professionnelle vérifiable.
      </p>
      <div className="mt-8">
        <OAuthButtons />
        <OrDivider />
        <RegisterWizard />
      </div>
      <p className="text-muted mt-6 text-sm">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-brand font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
