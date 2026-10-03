"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { oauthAction, type OAuthProvider } from "@/app/(auth)/actions";

const PROVIDERS: { id: OAuthProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "azure", label: "Microsoft" },
  { id: "linkedin_oidc", label: "LinkedIn" },
];

export function OAuthButtons() {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handle(provider: OAuthProvider) {
    setError(undefined);
    startTransition(async () => {
      const result = await oauthAction(provider);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {PROVIDERS.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => handle(p.id)}
            aria-label={`Continuer avec ${p.label}`}
          >
            {p.label}
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="text-muted relative my-6 text-center text-xs tracking-wide uppercase">
      <span className="bg-background relative z-10 px-3">ou avec e-mail</span>
      <span aria-hidden className="bg-border absolute inset-x-0 top-1/2 h-px" />
    </div>
  );
}
