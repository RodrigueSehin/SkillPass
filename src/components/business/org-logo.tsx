import { orgInitials } from "@/lib/business/org-stats";
import { cn } from "@/lib/utils/cn";

/** The organization's logo in a circle, or its initials on navy when none was uploaded. */
export function OrgLogo({
  name,
  version,
  className,
}: {
  name: string;
  /** `logoVersion` of the organization; changes with each upload. */
  version: string | null;
  className?: string;
}) {
  if (version) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- private, members-only image served by the API
      <img
        src={`/api/business/logo?v=${version}`}
        alt={`Logo ${name}`}
        className={cn("size-12 shrink-0 rounded-full bg-white object-cover ring-1 ring-slate-200", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "bg-navy flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white",
        className,
      )}
    >
      {orgInitials(name) || "?"}
    </span>
  );
}
