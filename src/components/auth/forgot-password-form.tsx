"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "./form-field";
import { forgotPasswordAction, type ActionState } from "@/app/(auth)/actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(forgotPasswordAction, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      <FormField label="Adresse e-mail" name="email" type="email" autoComplete="email" required />
      {state.error && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-success rounded-lg bg-green-50 px-3 py-2 text-sm">
          {state.success}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>
    </form>
  );
}
