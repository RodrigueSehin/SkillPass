import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock, ShieldAlert } from "lucide-react";
import { VerificationForm } from "@/components/business/verification-form";
import { requireBusiness } from "@/lib/business/context";

export const metadata: Metadata = { title: "Vérification de l'organisation" };
export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const ctx = await requireBusiness({ allowSuspended: true, allowUnverified: true });
  const org = ctx.organization;
  if (org.verificationStatus === "VERIFIED") redirect("/business");
  const rejected = org.verificationStatus === "REJECTED";

  return (
    <div className="border-border/60 shadow-soft rounded-2xl border bg-white p-6 sm:p-8">
      <span
        className={
          rejected
            ? "flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"
            : "text-brand flex size-12 items-center justify-center rounded-2xl bg-blue-50"
        }
      >
        {rejected ? <ShieldAlert className="size-6" aria-hidden /> : <Clock className="size-6" aria-hidden />}
      </span>
      <h1 className="text-navy mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        {rejected ? "Votre demande n'a pas été acceptée" : "Votre organisation est en cours de vérification"}
      </h1>
      <p className="text-muted mt-2 text-sm">
        {rejected
          ? `L'équipe SkillPass n'a pas pu valider « ${org.name} ».`
          : `Pour protéger les talents, chaque entreprise est vérifiée par l'équipe SkillPass avant d'accéder à SkillPass Business. « ${org.name} » sera accessible dès sa validation : revenez sur cette page ou rechargez-la.`}
      </p>

      {rejected && org.rejectionReason && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-semibold">Motif : </span>
          {org.rejectionReason}
        </p>
      )}

      <dl className="mt-5 grid gap-x-6 gap-y-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted text-xs">Organisation</dt>
          <dd className="text-navy font-semibold">{org.name}</dd>
        </div>
        <div>
          <dt className="text-muted text-xs">Contact</dt>
          <dd className="text-navy">{ctx.user.email}</dd>
        </div>
        {org.website && (
          <div>
            <dt className="text-muted text-xs">Site web</dt>
            <dd className="text-navy truncate">{org.website}</dd>
          </div>
        )}
        {org.industry && (
          <div>
            <dt className="text-muted text-xs">Domaine</dt>
            <dd className="text-navy">{org.industry}</dd>
          </div>
        )}
      </dl>

      <VerificationForm
        initialNote={org.verificationNote ?? ""}
        rejected={rejected}
        canEdit={ctx.member.role === "ADMIN"}
      />
    </div>
  );
}
