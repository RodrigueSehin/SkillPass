import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { OAuthButtons, OrDivider } from "@/components/auth/oauth-buttons";
import { RegisterWizard } from "@/components/auth/register-wizard";

export const metadata: Metadata = { title: "Créer mon SkillPass" };

export default function RegisterPage() {
  return (
    <AuthCard
      tab="register"
      title="Créer mon SkillPass"
      subtitle="Trois étapes pour construire votre identité professionnelle vérifiable."
    >
      <OAuthButtons mode="register" />
      <OrDivider>ou avec votre e-mail</OrDivider>
      <RegisterWizard />
      <p className="mt-6 text-center text-sm text-slate-600">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-brand font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  );
}
