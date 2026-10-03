import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Vérifiez votre e-mail" };

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Vérifiez votre e-mail"
      subtitle="Nous venons de vous envoyer un lien de confirmation. Cliquez dessus pour activer votre SkillPass."
    >
      <div className="text-center">
        <div className="text-brand mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-blue-50">
          <MailCheck className="size-8" aria-hidden />
        </div>
        <Button asChild variant="outline">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
