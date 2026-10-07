import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { OnboardingForm } from "@/components/business/onboarding-form";
import { requireUser } from "@/lib/auth/current-user";
import { loadBusinessScope } from "@/lib/business/context";

export const metadata: Metadata = { title: "Créer mon organisation" };

export default async function OnboardingPage() {
  const user = await requireUser();
  // Someone who already has an organization has nothing to set up.
  if (await loadBusinessScope(user.id)) redirect("/business");

  return (
    <div className="border-border/60 shadow-soft rounded-2xl border bg-white p-6 sm:p-8">
      <span className="text-brand flex size-12 items-center justify-center rounded-2xl bg-blue-50">
        <Building2 className="size-6" aria-hidden />
      </span>
      <h1 className="text-navy mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        Créez votre organisation
      </h1>
      <p className="text-muted mt-2 text-sm">
        SkillPass Business vous aide à trouver, évaluer et recruter des talents vérifiés. Quelques
        informations suffisent : vous pourrez tout compléter ensuite.
      </p>
      <OnboardingForm />
      <p className="text-muted mt-6 border-t border-slate-100 pt-4 text-xs">
        Vous avez reçu une invitation à rejoindre une organisation ? Ouvrez le lien reçu par e-mail : il vous
        y fera entrer directement.
      </p>
    </div>
  );
}
