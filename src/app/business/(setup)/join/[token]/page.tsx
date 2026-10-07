import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, UsersRound } from "lucide-react";
import { AcceptInvitation } from "@/components/business/accept-invitation";
import { requireUser } from "@/lib/auth/current-user";
import { NotFoundError } from "@/lib/errors";
import { getOrganizationService } from "@/services/container";
import { ORG_ROLE_LABELS } from "@/types/business";

// Private link: keep it out of search engines and out of the Referer header.
export const metadata: Metadata = {
  title: "Rejoindre une organisation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function JoinOrganizationPage({ params }: PageProps<"/business/join/[token]">) {
  const { token } = await params;
  await requireUser();
  let invite;
  try {
    invite = await getOrganizationService().getInvite(token);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  return (
    <div className="border-border/60 shadow-soft rounded-2xl border bg-white p-6 text-center sm:p-8">
      {invite.state === "open" ? (
        <>
          <span className="text-brand mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50">
            <UsersRound className="size-7" aria-hidden />
          </span>
          <h1 className="text-navy mt-4 text-2xl font-bold tracking-tight">
            Rejoindre {invite.organizationName}
          </h1>
          <p className="text-muted mt-2 text-sm">
            Bonjour {invite.firstName}, vous êtes invité(e) à rejoindre{" "}
            <strong>{invite.organizationName}</strong> sur SkillPass Business en tant que{" "}
            <strong>{ORG_ROLE_LABELS[invite.role]}</strong>.
          </p>
          {invite.message && (
            <blockquote className="border-brand/40 text-navy mt-4 border-l-2 bg-blue-50/60 px-4 py-3 text-left text-sm whitespace-pre-line">
              {invite.message}
            </blockquote>
          )}
          <AcceptInvitation token={token} organizationName={invite.organizationName} />
        </>
      ) : (
        <div className="py-4">
          {invite.state === "answered" ? (
            <CheckCircle2 className="text-success mx-auto size-10" aria-hidden />
          ) : (
            <Clock className="mx-auto size-10 text-amber-600" aria-hidden />
          )}
          <h1 className="mt-4 text-xl font-bold">
            {invite.state === "answered"
              ? "Cette invitation a déjà été utilisée"
              : "Cette invitation a expiré"}
          </h1>
          <p className="text-muted mt-2 text-sm">
            {invite.state === "answered"
              ? "Connectez-vous pour accéder à votre organisation."
              : `Demandez à un administrateur de ${invite.organizationName} de vous en envoyer une nouvelle.`}
          </p>
        </div>
      )}
    </div>
  );
}
