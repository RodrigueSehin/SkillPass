import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { CompanyRegisterForm } from "@/components/auth/company-register-form";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata: Metadata = { title: "Créer mon espace entreprise" };

export default async function CompanyRegisterPage() {
  // Someone already signed in only needs to create their organization.
  if (await getCurrentUser()) redirect("/business/onboarding");

  return (
    <AuthCard
      tab="register"
      title="Espace entreprise"
      subtitle="Trouvez, évaluez et recrutez des talents vérifiés avec SkillPass Business."
    >
      <CompanyRegisterForm />
      <p className="mt-6 text-center text-sm text-slate-600">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-brand font-semibold hover:underline">
          Se connecter
        </Link>
        <br />
        Vous cherchez un emploi ?{" "}
        <Link href="/register" className="text-brand font-semibold hover:underline">
          Créer mon SkillPass
        </Link>
      </p>
    </AuthCard>
  );
}
