import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Vérifiez votre e-mail" };

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      <div className="text-brand mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-blue-50">
        <MailCheck className="size-8" aria-hidden />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Vérifiez votre e-mail</h1>
      <p className="text-muted mt-3">
        Nous venons de vous envoyer un lien de confirmation. Cliquez dessus pour activer votre SkillPass.
      </p>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/login">Retour à la connexion</Link>
      </Button>
    </div>
  );
}
