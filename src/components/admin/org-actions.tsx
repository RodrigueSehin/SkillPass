"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Ban, PauseCircle, PlayCircle, RotateCcw, Wrench } from "lucide-react";
import {
  reactivateOrganizationAction,
  rejectOrganizationAction,
  reopenOrganizationAction,
  setOrganizationMaintenanceAction,
  setOrganizationPlanAction,
  suspendOrganizationAction,
  verifyOrganizationAction,
} from "@/app/admin/actions";
import { Switch } from "@/components/business/settings/controls";
import { PLANS } from "@/lib/business/plans";
import type { PlanCode } from "@/types/business";
import type { OrgVerificationStatus } from "@/types/business";

const button =
  "flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-50";

/** The decisions the administrator takes on one company. */
export function OrgActions({
  id,
  status,
  suspended,
  plan,
  maintenance,
}: {
  id: string;
  status: OrgVerificationStatus;
  suspended: boolean;
  plan: PlanCode;
  maintenance: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [maintenanceOn, setMaintenanceOn] = useState(maintenance);

  function run(action: () => Promise<{ error?: string }>, after?: () => void) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else {
        after?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {status !== "VERIFIED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => verifyOrganizationAction(id))}
            className={`${button} bg-green-600 text-white hover:bg-green-700`}
          >
            <BadgeCheck className="size-4" aria-hidden /> Valider l&apos;entreprise
          </button>
        )}
        {status === "PENDING" && !rejecting && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setRejecting(true)}
            className={`${button} border border-red-300 bg-white text-red-600 hover:bg-red-50`}
          >
            <Ban className="size-4" aria-hidden /> Refuser
          </button>
        )}
        {status === "REJECTED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => reopenOrganizationAction(id))}
            className={`${button} border-brand/40 text-brand border bg-white hover:bg-blue-50`}
          >
            <RotateCcw className="size-4" aria-hidden /> Rouvrir la demande
          </button>
        )}
        {status === "VERIFIED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => reopenOrganizationAction(id))}
            className={`${button} border-border text-navy border bg-white hover:bg-slate-50`}
          >
            <RotateCcw className="size-4" aria-hidden /> Retirer la validation
          </button>
        )}
        {suspended ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => reactivateOrganizationAction(id))}
            className={`${button} border-brand/40 text-brand border bg-white hover:bg-blue-50`}
          >
            <PlayCircle className="size-4" aria-hidden /> Réactiver
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => suspendOrganizationAction(id))}
            className={`${button} border border-amber-300 bg-white text-amber-700 hover:bg-amber-50`}
          >
            <PauseCircle className="size-4" aria-hidden /> Suspendre
          </button>
        )}
      </div>

      {rejecting && (
        <div className="space-y-2 rounded-xl bg-red-50 p-4">
          <label htmlFor="reject-reason" className="text-sm font-semibold text-red-800">
            Motif du refus (visible par l&apos;entreprise)
          </label>
          <textarea
            id="reject-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm"
          />
          <div className="flex gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => rejectOrganizationAction(id, reason),
                  () => setRejecting(false),
                )
              }
              className={`${button} bg-red-600 text-white hover:bg-red-700`}
            >
              Confirmer le refus
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className={`${button} border-border text-navy border bg-white`}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="org-plan" className="text-navy mb-1 block text-sm font-semibold">
            Plan
          </label>
          <select
            id="org-plan"
            defaultValue={plan}
            disabled={pending}
            onChange={(e) => run(() => setOrganizationPlanAction(id, e.target.value))}
            className="border-border h-11 w-full rounded-xl border bg-white px-3 text-sm"
          >
            {(Object.keys(PLANS) as PlanCode[]).map((code) => (
              <option key={code} value={code}>
                {PLANS[code].name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2.5">
          <span className="text-navy flex items-center gap-2 text-sm font-semibold">
            <Wrench className="text-muted size-4" aria-hidden /> Mode maintenance
          </span>
          <Switch
            checked={maintenanceOn}
            label="Mode maintenance"
            disabled={pending}
            onChange={(on) => {
              setMaintenanceOn(on);
              run(() => setOrganizationMaintenanceAction(id, on));
            }}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
