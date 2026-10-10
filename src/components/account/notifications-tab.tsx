"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, Mail, Monitor, RotateCcw, Save } from "lucide-react";
import { saveNotificationsAction } from "@/app/dashboard/settings/actions";
import { Switch } from "@/components/business/settings/controls";
import { SoonBadge } from "@/components/business/settings/rows";
import { Panel } from "@/components/business/ui";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_PROFILE_SETTINGS,
  TALENT_CHANNELS,
  TALENT_CHANNEL_LABELS,
  TALENT_NOTIFICATION_GROUPS,
  type TalentChannel,
  type TalentNotificationSettings,
} from "@/types/profile-settings";

const ICONS = { inApp: Monitor, email: Mail } as const;
const DAYS = [
  [1, "Lun"],
  [2, "Mar"],
  [3, "Mer"],
  [4, "Jeu"],
  [5, "Ven"],
  [6, "Sam"],
  [0, "Dim"],
] as const;
const TIMES = Array.from(
  { length: 48 },
  (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
);
const select = "border-border h-11 w-full rounded-xl border bg-white px-3 text-sm";

export function NotificationsTab({ initial }: { initial: TalentNotificationSettings }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const change = (next: TalentNotificationSettings) => {
    setSaved(false);
    setValue(next);
  };
  const toggle = (key: string, channel: TalentChannel, on: boolean) =>
    change({ ...value, matrix: { ...value.matrix, [key]: { ...value.matrix[key]!, [channel]: on } } });

  function save() {
    setError(undefined);
    startTransition(async () => {
      const result = await saveNotificationsAction(value);
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Panel className="min-w-0 p-6">
        <h2 className="text-navy text-xl font-bold">Préférences de notification</h2>
        <p className="text-muted text-sm">
          Choisissez comment vous souhaitez être prévenu. Vos choix sont enregistrés ; l&apos;envoi des
          notifications arrive bientôt <SoonBadge className="ml-1 align-middle" />
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-border/60 border-b">
                <th className="text-navy py-3 font-bold">Type de notification</th>
                {TALENT_CHANNELS.map((c) => {
                  const Icon = ICONS[c];
                  return (
                    <th key={c} className="text-navy w-24 py-3 text-center font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="size-4" aria-hidden /> {TALENT_CHANNEL_LABELS[c]}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            {TALENT_NOTIFICATION_GROUPS.map((group) => (
              <tbody key={group.title}>
                <tr>
                  <th colSpan={3} className="text-navy pt-5 pb-1 text-sm font-bold">
                    {group.title}
                  </th>
                </tr>
                {group.events.map((e) => (
                  <tr key={e.key} className="border-border/40 border-b last:border-0">
                    <td className="py-3 pr-3">
                      <p className="text-navy font-semibold">{e.title}</p>
                      <p className="text-muted text-xs">{e.text}</p>
                    </td>
                    {TALENT_CHANNELS.map((c) => (
                      <td key={c} className="py-3 text-center">
                        <span className="inline-flex">
                          <Switch
                            checked={Boolean(value.matrix[e.key]?.[c])}
                            onChange={(on) => toggle(e.key, c, on)}
                            label={`${e.title} — ${TALENT_CHANNEL_LABELS[c]}`}
                          />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>

        {error && (
          <p role="alert" className="text-danger mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-success mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm">
            Préférences enregistrées.
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => change({ ...DEFAULT_PROFILE_SETTINGS.notifications })}
            className="border-brand/40 text-brand flex h-11 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-blue-50"
          >
            <RotateCcw className="size-4" aria-hidden /> Réinitialiser par défaut
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="bg-brand flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="size-4" aria-hidden />{" "}
            {pending ? "Enregistrement…" : "Enregistrer les préférences"}
          </button>
        </div>
      </Panel>

      <aside className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-navy flex items-center gap-2 font-bold">
            Tester une notification <SoonBadge />
          </h2>
          <p className="text-muted mt-1 text-sm">
            Envoyez-vous une notification de test pour vérifier vos réglages.
          </p>
          <button
            type="button"
            disabled
            className="border-border mt-4 h-11 w-full rounded-xl border bg-white text-sm font-semibold opacity-50"
          >
            Envoyer un test
          </button>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Heures de réception</h2>
          <p className="text-muted mt-1 text-sm">
            Plages horaires pendant lesquelles vous voulez être prévenu.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-navy text-sm font-semibold">Limiter à certaines heures</span>
            <Switch
              checked={value.limitHours}
              onChange={(on) => change({ ...value, limitHours: on })}
              label="Limiter à certaines heures"
            />
          </div>
          <div className={cn("mt-4 grid grid-cols-2 gap-3", !value.limitHours && "opacity-50")}>
            <div>
              <label htmlFor="notif-start" className="text-navy mb-1 block text-sm font-semibold">
                Heure de début
              </label>
              <select
                id="notif-start"
                value={value.start}
                disabled={!value.limitHours}
                onChange={(e) => change({ ...value, start: e.target.value })}
                className={select}
              >
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="notif-end" className="text-navy mb-1 block text-sm font-semibold">
                Heure de fin
              </label>
              <select
                id="notif-end"
                value={value.end}
                disabled={!value.limitHours}
                onChange={(e) => change({ ...value, end: e.target.value })}
                className={select}
              >
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-navy mt-4 mb-2 text-sm font-semibold">Jours actifs</p>
          <div className={cn("flex flex-wrap gap-2", !value.limitHours && "opacity-50")}>
            {DAYS.map(([day, label]) => {
              const on = value.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  disabled={!value.limitHours}
                  onClick={() =>
                    change({
                      ...value,
                      days: on ? value.days.filter((d) => d !== day) : [...value.days, day],
                    })
                  }
                  className={cn(
                    "size-10 rounded-full text-xs font-semibold",
                    on ? "bg-brand text-white" : "bg-slate-100 text-slate-500",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="bg-blue-50/60 p-5">
          <p className="text-navy flex items-center gap-2 font-bold">
            <Info className="text-brand size-5" aria-hidden /> Bon à savoir
          </p>
          <p className="text-navy/80 mt-2 text-sm">
            Les notifications vous aident à ne manquer ni une opportunité, ni la validation d&apos;une
            compétence.
          </p>
        </Panel>
      </aside>
    </div>
  );
}
