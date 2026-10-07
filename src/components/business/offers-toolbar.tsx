"use client";

import { useEffect, useState } from "react";
import { Filter, Search } from "lucide-react";
import { useUrlParams } from "@/lib/hooks/use-url-params";
import { cn } from "@/lib/utils/cn";
import { JOB_CONTRACTS, JOB_CONTRACT_LABELS } from "@/types/job-offer";

const select = "border-border h-10 rounded-xl border bg-white px-3 text-sm";

/** Search box and the "Filtres" panel (contract and department) of the offers list. */
export function OffersToolbar({ departments }: { departments: { id: string; name: string }[] }) {
  const { params, set } = useUrlParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(Boolean(params.get("contract") || params.get("department")));
  const active = [params.get("contract"), params.get("department")].filter(Boolean).length;

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => {
      set("q", q);
      if (params.get("page")) set("page", "");
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const change = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    set(key, e.target.value);
    if (params.get("page")) set("page", "");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="text-muted pointer-events-none absolute top-3 left-3.5 size-4" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Rechercher une offre"
            placeholder="Rechercher une offre…"
            className="border-border h-10 w-full rounded-xl border bg-white pr-3 pl-10 text-sm"
          />
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium",
            open || active
              ? "border-brand text-brand bg-blue-50"
              : "border-border text-navy bg-white hover:bg-slate-50",
          )}
        >
          <Filter className="size-4" aria-hidden /> Filtres{active > 0 && ` (${active})`}
        </button>
      </div>
      {open && (
        <div className="mt-3 flex flex-wrap items-end gap-4 rounded-xl bg-slate-50 p-4">
          <label className="text-navy text-sm font-medium">
            Type de contrat
            <select
              value={params.get("contract") ?? ""}
              onChange={change("contract")}
              className={`${select} mt-1 block min-w-44`}
            >
              <option value="">Tous</option>
              {JOB_CONTRACTS.map((c) => (
                <option key={c} value={c}>
                  {JOB_CONTRACT_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-navy text-sm font-medium">
            Département
            <select
              value={params.get("department") ?? ""}
              onChange={change("department")}
              className={`${select} mt-1 block min-w-52`}
            >
              <option value="">Tous</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          {active > 0 && (
            <button
              type="button"
              className="text-brand pb-2 text-sm font-semibold hover:underline"
              onClick={() => {
                set("contract", "");
                set("department", "");
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}
    </div>
  );
}
