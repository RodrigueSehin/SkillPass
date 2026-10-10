"use client";

/** "Tout sélectionner" for the saved list: ticks every row checkbox of the surrounding form. */
export function SelectAll({ formId, label }: { formId: string; label: string }) {
  return (
    <label className="text-navy flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="accent-brand size-4"
        onChange={(e) => {
          const form = document.getElementById(formId);
          form?.querySelectorAll<HTMLInputElement>("input[name=id]").forEach((box) => {
            box.checked = e.target.checked;
          });
        }}
      />
      {label}
    </label>
  );
}
