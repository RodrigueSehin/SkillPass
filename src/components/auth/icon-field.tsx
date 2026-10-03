"use client";

import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

interface IconFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
}

/** Text field with a leading icon. Password fields get a show/hide toggle. */
export function IconField({
  id,
  label,
  icon: Icon,
  error,
  type = "text",
  className,
  ...props
}: IconFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 size-[1.15rem] -translate-y-1/2 text-slate-500"
          aria-hidden
        />
        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "text-foreground focus-visible:border-brand aria-[invalid=true]:border-danger h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 text-sm transition-colors placeholder:text-slate-400",
            isPassword ? "pr-12" : "pr-4",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={revealed}
            className="hover:text-foreground absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            {revealed ? (
              <EyeOff className="size-[1.15rem]" aria-hidden />
            ) : (
              <Eye className="size-[1.15rem]" aria-hidden />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
