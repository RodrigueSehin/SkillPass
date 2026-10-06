import { cn } from "@/lib/utils/cn";

const TILES = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
];

/** Brand marks drawn in CSS: no external image is needed. */
export function CompanyLogo({ company, className }: { company: string; className?: string }) {
  const name = company.trim();
  const base = "flex shrink-0 items-center justify-center";

  if (/^agl$/i.test(name)) {
    return (
      <span
        aria-hidden
        className={cn(base, "text-navy size-12 text-xl font-black tracking-tight", className)}
      >
        AGL
      </span>
    );
  }
  if (/microsoft/i.test(name)) {
    return (
      <span aria-hidden className={cn(base, "size-12", className)}>
        <span className="grid size-9 grid-cols-2 gap-0.5">
          <i className="bg-[#F25022]" />
          <i className="bg-[#7FBA00]" />
          <i className="bg-[#00A4EF]" />
          <i className="bg-[#FFB900]" />
        </span>
      </span>
    );
  }
  if (/orange/i.test(name)) {
    return (
      <span aria-hidden className={cn(base, "size-12", className)}>
        <span className="flex size-9 items-end bg-[#FF7900] p-1 text-[8px] leading-none font-bold text-white">
          orange
        </span>
      </span>
    );
  }
  if (/sehin/i.test(name)) {
    return (
      <span
        aria-hidden
        className={cn(base, "bg-navy size-12 rounded-xl text-2xl font-black text-white", className)}
      >
        S
      </span>
    );
  }
  if (/upwork/i.test(name)) {
    return (
      <span
        aria-hidden
        className={cn(base, "size-12 rounded-xl bg-[#14A800] text-2xl font-black text-white", className)}
      >
        up
      </span>
    );
  }
  if (/atlantique/i.test(name)) {
    return (
      <span
        aria-hidden
        className={cn(base, "size-12 rounded-xl bg-orange-50 text-xl font-black text-[#C2410C]", className)}
      >
        BA
      </span>
    );
  }
  const tile = TILES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TILES.length];
  return (
    <span aria-hidden className={cn(base, "size-12 rounded-xl text-lg font-extrabold", tile, className)}>
      {name.slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}
