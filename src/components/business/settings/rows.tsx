import { cn } from "@/lib/utils/cn";

/** Marks a control that is shown for completeness but does nothing yet. */
export function SoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500",
        className,
      )}
    >
      Bientôt
    </span>
  );
}

/** A line with an icon, a title, a sentence and a control on the right. */
export function SettingRow({
  icon: Icon,
  title,
  text,
  children,
  soon,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  text: string;
  children: React.ReactNode;
  soon?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-brand flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-navy flex items-center gap-2 text-sm font-semibold">
          {title} {soon && <SoonBadge />}
        </p>
        <p className="text-muted text-xs">{text}</p>
      </div>
      {children}
    </div>
  );
}
