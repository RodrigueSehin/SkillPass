"use client";

import { useUrlParams } from "@/lib/hooks/use-url-params";
import { TALENT_SORTS } from "@/lib/business/talent-search";

export function TalentSort({ current }: { current: string }) {
  const { set } = useUrlParams();
  return (
    <label className="text-muted flex items-center gap-2 text-sm">
      Trier par
      <select
        value={current}
        onChange={(e) => {
          set("sort", e.target.value === "match" ? "" : e.target.value);
          set("page", "");
        }}
        className="border-border text-navy h-10 rounded-xl border bg-white px-3 text-sm"
      >
        {TALENT_SORTS.map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
