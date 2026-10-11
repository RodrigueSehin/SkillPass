"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProfilePlanAction, setProfileRoleAction } from "@/app/admin/actions";
import { TALENT_PLAN_CODES, TALENT_PLANS, type TalentPlanCode } from "@/lib/plans/entitlements";
import { ROLE_LABELS, type UserRole } from "@/types/profile";

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

/** Changes the platform role of one account. Saves on change and goes back if it is refused. */
export function RoleSelect({
  profileId,
  role,
  disabled,
}: {
  profileId: string;
  role: UserRole;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <select
        aria-label="Rôle sur la plateforme"
        value={value}
        disabled={disabled || pending}
        onChange={(e) => {
          const next = e.target.value as UserRole;
          const before = value;
          setValue(next);
          setError(undefined);
          startTransition(async () => {
            const result = await setProfileRoleAction(profileId, next);
            if (result.error) {
              setValue(before);
              setError(result.error);
            } else router.refresh();
          });
        }}
        className="border-border h-9 rounded-lg border bg-white px-2 text-sm disabled:opacity-60"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-danger mt-1 max-w-48 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

/** Changes the talent plan of one account (Free or Pro). */
export function PlanSelect({ profileId, plan }: { profileId: string; plan: TalentPlanCode }) {
  const router = useRouter();
  const [value, setValue] = useState(plan);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <select
        aria-label="Plan du talent"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as TalentPlanCode;
          const before = value;
          setValue(next);
          setError(undefined);
          startTransition(async () => {
            const result = await setProfilePlanAction(profileId, next);
            if (result.error) {
              setValue(before);
              setError(result.error);
            } else router.refresh();
          });
        }}
        className="border-border h-9 rounded-lg border bg-white px-2 text-sm disabled:opacity-60"
      >
        {TALENT_PLAN_CODES.map((code) => (
          <option key={code} value={code}>
            {TALENT_PLANS[code].name}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-danger mt-1 max-w-48 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
