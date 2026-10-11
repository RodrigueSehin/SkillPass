import { cn } from "@/lib/utils/cn";
import { VERIFICATION_LABELS, type OrgVerificationStatus } from "@/types/business";

const TONES: Record<OrgVerificationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  VERIFIED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-600",
};

/** Verification status of a company, plus a second pill when it is suspended. */
export function OrgStatusPills({ status, suspended }: { status: OrgVerificationStatus; suspended: boolean }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      <span className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", TONES[status])}>
        {VERIFICATION_LABELS[status]}
      </span>
      {suspended && (
        <span className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
          Suspendue
        </span>
      )}
    </span>
  );
}

export const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export const DATETIME = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
