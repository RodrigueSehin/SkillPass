import { Globe, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EVIDENCE_VISIBILITIES, EVIDENCE_VISIBILITY_LABELS, type EvidenceVisibility } from "@/types/evidence";

const ICONS = { PUBLIC: Globe, RECRUITERS: Users, PRIVATE: Lock } as const;

export function VisibilityPicker({
  value,
  onChange,
  withIcons = false,
}: {
  value: EvidenceVisibility;
  onChange: (value: EvidenceVisibility) => void;
  withIcons?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Visibilité" className="grid gap-3 md:grid-cols-3">
      {EVIDENCE_VISIBILITIES.map((v) => {
        const Icon = ICONS[v];
        const on = value === v;
        return (
          <label
            key={v}
            className={cn(
              "focus-within:ring-brand/40 flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 focus-within:ring-2",
              on ? "border-brand bg-blue-50" : "border-border hover:bg-slate-50",
            )}
          >
            <input
              type="radio"
              name="visibility"
              value={v}
              checked={on}
              onChange={() => onChange(v)}
              className="accent-brand mt-1 size-4 shrink-0"
            />
            {withIcons && <Icon className="text-navy mt-0.5 size-5 shrink-0" aria-hidden />}
            <span>
              <span className="text-navy block text-sm font-semibold">
                {EVIDENCE_VISIBILITY_LABELS[v].title}
              </span>
              <span className="text-muted block text-xs">{EVIDENCE_VISIBILITY_LABELS[v].hint}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
