"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Switch } from "@/components/business/settings/controls";
import { SettingRow } from "@/components/business/settings/rows";
import type { ActionResult } from "@/lib/actions/run";

/** One switch that saves as soon as it is flipped, and goes back when the save fails. */
export function ToggleSetting({
  icon,
  title,
  text,
  initial,
  save,
  disabled,
  invert,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  initial: boolean;
  save: (next: boolean) => Promise<ActionResult>;
  disabled?: boolean;
  /** The switch shows the opposite of the stored value (e.g. "pause" is on when the profile is not public). */
  invert?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function flip(shown: boolean) {
    const next = invert ? !shown : shown;
    setError(undefined);
    setValue(next);
    startTransition(async () => {
      const result = await save(next);
      if (result.error) {
        setValue(!next);
        setError(result.error);
      } else router.refresh();
    });
  }

  return (
    <div>
      <SettingRow icon={icon} title={title} text={text}>
        <Switch
          checked={invert ? !value : value}
          onChange={flip}
          label={title}
          disabled={disabled || pending}
        />
      </SettingRow>
      {error && (
        <p role="alert" className="text-danger pb-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
