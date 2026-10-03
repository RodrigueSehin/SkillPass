"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "./form-field";
import { loginAction, type ActionState } from "@/app/(auth)/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormField label="Adresse e-mail" name="email" type="email" autoComplete="email" required />
      <FormField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {state.error && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
