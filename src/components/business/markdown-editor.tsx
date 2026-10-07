"use client";

import { useRef } from "react";
import { Bold, Italic, Link2, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Tool = "bold" | "italic" | "bullets" | "numbers" | "link";
const TOOLS: { tool: Tool; label: string; icon: typeof Bold }[] = [
  { tool: "bold", label: "Gras", icon: Bold },
  { tool: "italic", label: "Italique", icon: Italic },
  { tool: "bullets", label: "Liste à puces", icon: List },
  { tool: "numbers", label: "Liste numérotée", icon: ListOrdered },
  { tool: "link", label: "Lien", icon: Link2 },
];

/**
 * A text area with a small toolbar that writes light markdown (see lib/rich-text.ts for the reverse).
 * Bullet lines become the "missions" of the offer on the talent side.
 */
export function MarkdownEditor({
  id,
  value,
  onChange,
  maxLength,
  rows = 7,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows?: number;
  invalid?: boolean;
}) {
  const area = useRef<HTMLTextAreaElement>(null);

  function apply(tool: Tool | "heading") {
    const el = area.current;
    if (!el) return;
    const lineWise = tool === "bullets" || tool === "numbers" || tool === "heading";
    let start = el.selectionStart;
    let end = el.selectionEnd;
    if (lineWise) {
      start = el.value.lastIndexOf("\n", start - 1) + 1;
      const nl = el.value.indexOf("\n", end);
      end = nl === -1 ? el.value.length : nl;
    }
    const selected = el.value.slice(start, end);
    const lines = (text: string, prefix: (i: number) => string) =>
      (text || "Élément")
        .split("\n")
        .map((l, i) => `${prefix(i)}${l.replace(/^(?:[-*•]|\d+\.)\s+/, "")}`)
        .join("\n");
    const replacement =
      tool === "bold"
        ? `**${selected || "texte"}**`
        : tool === "italic"
          ? `*${selected || "texte"}*`
          : tool === "bullets"
            ? lines(selected, () => "- ")
            : tool === "numbers"
              ? lines(selected, (i) => `${i + 1}. `)
              : tool === "heading"
                ? `## ${selected.replace(/^#{1,3}\s+/, "") || "Titre"}`
                : `[${selected || "texte"}](https://)`;
    const next = (el.value.slice(0, start) + replacement + el.value.slice(end)).slice(0, maxLength);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, Math.min(start + replacement.length, next.length));
    });
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "focus-within:ring-brand/40 overflow-hidden rounded-xl border focus-within:ring-2",
          invalid ? "border-danger" : "border-border",
        )}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
          <select
            aria-label="Style du paragraphe"
            defaultValue="p"
            onChange={(e) => {
              if (e.target.value === "h") apply("heading");
              e.target.value = "p";
            }}
            className="border-border mr-1 h-8 rounded-md border bg-white px-2 text-sm"
          >
            <option value="p">Paragraphe</option>
            <option value="h">Titre</option>
          </select>
          {TOOLS.map(({ tool, label, icon: Icon }) => (
            <button
              key={tool}
              type="button"
              aria-label={label}
              title={label}
              onClick={() => apply(tool)}
              className="text-navy flex size-8 items-center justify-center rounded-md hover:bg-blue-100"
            >
              <Icon className="size-4" aria-hidden />
            </button>
          ))}
        </div>
        <textarea
          ref={area}
          id={id}
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          className="w-full resize-y bg-white px-4 py-3 text-sm outline-none"
        />
      </div>
      <p className="text-muted text-right text-xs">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
