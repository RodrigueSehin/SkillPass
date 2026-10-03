"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconField } from "./icon-field";
import { loginAction, type ActionState } from "@/app/(auth)/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <IconField
        id="login-email"
        label="Adresse e-mail"
        name="email"
        type="email"
        icon={Mail}
        placeholder="votre@email.com"
        autoComplete="email"
        required
      />
      <IconField
        id="login-password"
        label="Mot de passe"
        name="password"
        type="password"
        icon={LockKeyhole}
        placeholder="••••••••••"
        autoComplete="current-password"
        required
      />

      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" name="remember" defaultChecked className="accent-brand size-[1.1rem]" />
          Se souvenir de moi
        </label>
        <Link href="/forgot-password" className="text-brand font-medium hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>

      {state.error && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        variant="cta"
        size="lg"
        className="h-13 w-full rounded-xl text-base"
        disabled={pending}
      >
        {pending ? (
          "Connexion…"
        ) : (
          <>
            Se connecter <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}
