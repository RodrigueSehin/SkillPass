"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface HeaderMenuProps {
  /** Accessible name of the trigger button. */
  label: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  /** Use "menu" when the panel only holds links/actions. */
  panelRole?: "menu";
  align?: "left" | "right";
  triggerClassName?: string;
  panelClassName?: string;
}

/** Small dropdown for the top bar: closes on outside click or Escape and returns focus to its button. */
export function HeaderMenu({
  label,
  trigger,
  children,
  panelRole,
  align = "right",
  triggerClassName,
  panelClassName,
}: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup={panelRole ?? "dialog"}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn("flex items-center rounded-xl transition-colors hover:bg-slate-100", triggerClassName)}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={panelId}
          role={panelRole}
          aria-label={label}
          onClick={(e) => {
            // Navigating from inside the panel closes it.
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className={cn(
            "border-border shadow-lift absolute top-full z-40 mt-2 w-72 rounded-2xl border bg-white p-2",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
