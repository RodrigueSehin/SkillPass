import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Mot de passe oublié</h1>
      <p className="mt-2 text-muted">Saisissez votre e-mail, nous vous envoyons un lien de réinitialisation.</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-brand hover:underline">
        ← Retour à la connexion
      </Link>
    </>
  );
}
