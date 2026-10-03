import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "border-border bg-surface placeholder:text-muted/70 focus-visible:border-brand aria-[invalid=true]:border-danger flex h-11 w-full rounded-xl border px-4 text-sm disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
