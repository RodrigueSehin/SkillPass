"use client";

import { useState, useTransition } from "react";
import { oauthAction, type OAuthProvider } from "@/app/(auth)/actions";

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <path fill="#F25022" d="M2 2h9.500v9.500H2z" />
      <path fill="#7FBA00" d="M12.500 2H22v9.500h-9.500z" />
      <path fill="#00A4EF" d="M2 12.500h9.500V22H2z" />
      <path fill="#FFB900" d="M12.500 12.500H22V22h-9.500z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.560 12.250c0-.780-.070-1.530-.200-2.250H12v4.260h5.920a5.060 5.060 0 0 1-2.190 3.320v2.770h3.540c2.080-1.920 3.290-4.740 3.290-8.100Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.970 0 5.460-.980 7.280-2.660l-3.540-2.770c-.980.660-2.240 1.060-3.740 1.060-2.870 0-5.300-1.940-6.160-4.550H2.180v2.840A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.840 14.080a6.600 6.600 0 0 1 0-4.160V7.080H2.180a11 11 0 0 0 0 9.840l3.660-2.840Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.380c1.620 0 3.060.560 4.210 1.640l3.150-3.150C17.450 2.090 14.970 1 12 1A11 11 0 0 0 2.180 7.080l3.660 2.840C6.700 7.310 9.130 5.380 12 5.380Z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.100 9.500H4.300V19h2.800V9.500ZM5.700 5a1.650 1.650 0 1 0 0 3.300A1.650 1.650 0 0 0 5.700 5ZM19.700 13.600c0-2.600-1.400-4.300-3.700-4.300-1.200 0-2 .600-2.400 1.200V9.500h-2.700V19h2.800v-5.200c0-1.300.600-2.100 1.700-2.100s1.500.800 1.500 2.100V19h2.800v-5.400Z"
      />
    </svg>
  );
}

const PROVIDERS: { id: OAuthProvider; name: string; icon: () => React.JSX.Element }[] = [
  { id: "azure", name: "Microsoft", icon: MicrosoftIcon },
  { id: "google", name: "Google", icon: GoogleIcon },
  { id: "linkedin_oidc", name: "LinkedIn", icon: LinkedInIcon },
];

/** `mode` only changes the wording: sign-in and sign-up share the same OAuth flow. */
export function OAuthButtons({ mode = "login" }: { mode?: "login" | "register" }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const verb = mode === "login" ? "Se connecter" : "S'inscrire";

  function handle(provider: OAuthProvider) {
    setError(undefined);
    startTransition(async () => {
      const result = await oauthAction(provider);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      {PROVIDERS.map(({ id, name, icon: Icon }) => (
        <button
          key={id}
          type="button"
          disabled={pending}
          onClick={() => handle(id)}
          className="text-foreground flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-sm font-medium transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <Icon />
          {verb} avec {name}
        </button>
      ))}
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export function OrDivider({ children = "ou" }: { children?: React.ReactNode }) {
  return (
    <div className="relative my-6 text-center text-sm text-slate-500">
      <span className="relative z-10 bg-white px-3">{children}</span>
      <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
    </div>
  );
}
