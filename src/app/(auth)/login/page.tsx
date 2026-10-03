import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons, OrDivider } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const authError = params.error === "auth";

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Bon retour 👋</h1>
      <p className="mt-2 text-muted">Connectez-vous pour accéder à votre SkillPass.</p>
      {authError && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          La connexion a échoué. Veuillez réessayer.
        </p>
      )}
      <div className="mt-8">
        <OAuthButtons />
        <OrDivider />
        <LoginForm next={next} />
      </div>
      <div className="mt-6 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-brand hover:underline">
          Mot de passe oublié ?
        </Link>
        <Link href="/register" className="font-semibold text-brand hover:underline">
          Créer mon SkillPass
        </Link>
      </div>
    </>
  );
}
