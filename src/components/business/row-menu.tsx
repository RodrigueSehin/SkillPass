"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface RowMenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/** The "…" menu at the end of a table row. Closes on outside click or Escape. */
export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass = (item: RowMenuItem) =>
    cn(
      "flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-40",
      item.danger ? "text-danger" : "text-foreground",
    );

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-muted rounded-md p-1.5 hover:bg-slate-100"
      >
        <MoreHorizontal className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="border-border shadow-lift absolute top-full right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border bg-white"
        >
          {items.map((item) =>
            item.href ? (
              <Link key={item.label} role="menuitem" href={item.href} className={itemClass(item)}>
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                className={itemClass(item)}
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
