"use client";

import { useUrlParams } from "@/lib/hooks/use-url-params";

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

/** Multi-select facet: the URL keeps the chosen values as a comma-separated list. */
export function FilterChecks({
  legend,
  name,
  options,
  /** Also drops the page number: a new filter can leave the current page empty. */
  resetPage = false,
}: {
  legend: string;
  name: string;
  options: FilterOption[];
  resetPage?: boolean;
}) {
  const { params, set } = useUrlParams();
  const current = (params.get(name) ?? "").split(",").filter(Boolean);
  if (options.length === 0) return null;

  function toggle(value: string) {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    set(name, next.join(","));
    if (resetPage && params.get("page")) set("page", "");
  }

  return (
    <fieldset className="mt-5">
      <legend className="text-navy mb-2 text-sm font-bold">{legend}</legend>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label key={o.value} className="text-navy flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={current.includes(o.value)}
              onChange={() => toggle(o.value)}
              className="accent-brand size-4 rounded"
            />
            {o.label} ({o.count})
          </label>
        ))}
      </div>
    </fieldset>
  );
}
