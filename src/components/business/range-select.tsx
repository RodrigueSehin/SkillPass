"use client";

import { CalendarDays } from "lucide-react";
import { ANALYTICS_RANGES } from "@/lib/business/analytics";
import { useUrlParams } from "@/lib/hooks/use-url-params";

export function RangeSelect({ current }: { current: string }) {
  const { set } = useUrlParams();
  return (
    <label className="border-border text-navy relative flex h-12 items-center gap-2 rounded-xl border bg-white pr-3 pl-3.5 text-sm font-medium">
      <CalendarDays className="text-muted size-4" aria-hidden />
      <span className="sr-only">Période</span>
      <select
        value={current}
        onChange={(e) => set("range", e.target.value)}
        className="bg-transparent pr-2 outline-none"
      >
        {ANALYTICS_RANGES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
