"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils/cn";

export function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root
      value={value}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("bg-brand h-full rounded-full transition-all", indicatorClassName)}
        style={{ width: `${value ?? 0}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
