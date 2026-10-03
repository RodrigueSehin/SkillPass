import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Mot de passe oublié"
      subtitle="Saisissez votre e-mail, nous vous envoyons un lien de réinitialisation."
    >
      <ForgotPasswordForm />
      <Link href="/login" className="text-brand mt-6 inline-block text-sm font-semibold hover:underline">
        ← Retour à la connexion
      </Link>
    </AuthCard>
  );
}
