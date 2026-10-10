"use client";

import { useState, useTransition } from "react";
import { setMatchStatusAction } from "@/app/business/matching/actions";
import { MATCH_STATUSES, MATCH_STATUS_LABELS, type MatchStatus } from "@/types/matching";

/** Changes where a saved talent stands. Saves on change. */
export function StatusSelect({
  id,
  status,
  disabled,
}: {
  id: string;
  status: MatchStatus;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <label htmlFor={`status-${id}`} className="text-navy mb-1 block text-xs font-semibold">
        Statut
      </label>
      <select
        id={`status-${id}`}
        value={value}
        disabled={disabled || pending}
        onChange={(e) => {
          const next = e.target.value as MatchStatus;
          const before = value;
          setValue(next);
          start(async () => {
            const res = await setMatchStatusAction(id, next);
            if (res.error) {
              setValue(before);
              setError(res.error);
            } else setError(null);
          });
        }}
        className="border-border focus-visible:ring-brand/40 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus-visible:ring-2 disabled:opacity-60"
      >
        {MATCH_STATUSES.map((s) => (
          <option key={s} value={s}>
            {MATCH_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-danger mt-1 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
