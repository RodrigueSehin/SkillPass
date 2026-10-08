"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reactivateOrganizationAction } from "@/app/business/parametres/actions";
import { Button } from "@/components/ui/button";

export function ReactivateButton() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-2">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await reactivateOrganizationAction();
            if (result.error) setError(result.error);
            else router.replace("/business");
          })
        }
      >
        {pending ? "Réactivation…" : "Réactiver l'organisation"}
      </Button>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
