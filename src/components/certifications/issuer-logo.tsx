import { cn } from "@/lib/utils/cn";

const BRANDS: { match: RegExp; tile: string }[] = [
  { match: /amazon|aws/i, tile: "bg-orange-100 text-orange-700" },
  { match: /google/i, tile: "bg-red-100 text-red-600" },
  { match: /scrum/i, tile: "bg-sky-100 text-sky-700" },
  { match: /peoplecert|axelos|itil/i, tile: "bg-purple-100 text-purple-700" },
];

/** Microsoft four-square mark, or a tinted tile with the issuer's initials. */
export function IssuerLogo({ issuer, className }: { issuer: string; className?: string }) {
  const name = issuer.trim();
  if (/microsoft/i.test(name)) {
    return (
      <span
        aria-hidden
        className={cn(
          "grid size-11 shrink-0 grid-cols-2 gap-0.5 rounded-lg bg-white p-2.5 ring-1 ring-slate-200",
          className,
        )}
      >
        <i className="bg-[#F25022]" />
        <i className="bg-[#7FBA00]" />
        <i className="bg-[#00A4EF]" />
        <i className="bg-[#FFB900]" />
      </span>
    );
  }
  const tile = BRANDS.find((b) => b.match.test(name))?.tile ?? "bg-blue-100 text-brand";
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
        tile,
        className,
      )}
    >
      {name ? name.slice(0, 2).toUpperCase() : "?"}
    </span>
  );
}
