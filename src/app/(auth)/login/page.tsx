import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, Wordmark } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons, OrDivider } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const authError = params.error === "auth";

  return (
    <AuthCard
      tab="login"
      title={
        <>
          Bienvenue sur <Wordmark />
        </>
      }
      subtitle="Connectez-vous à votre espace pour continuer."
    >
      {authError && (
        <p role="alert" className="text-danger mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm">
          La connexion a échoué. Veuillez réessayer.
        </p>
      )}
      <LoginForm next={next} />
      <OrDivider />
      <OAuthButtons mode="login" />

      <p className="mt-6 rounded-xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-600">
        Vous n&apos;avez pas encore de compte ?
        <br />
        <Link href="/register" className="text-brand font-semibold hover:underline">
          Créer un compte
        </Link>
      </p>
    </AuthCard>
  );
}
