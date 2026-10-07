"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitationAction } from "@/app/business/actions";
import { Button } from "@/components/ui/button";

export function AcceptInvitation({ token, organizationName }: { token: string; organizationName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvitationAction(token);
            if (result.error) setError(result.error);
            else router.push("/business");
          })
        }
      >
        {pending ? "Connexion…" : `Rejoindre ${organizationName}`}
      </Button>
    </div>
  );
}
