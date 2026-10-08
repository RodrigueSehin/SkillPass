"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, Mail, Monitor, RotateCcw, Save, Smartphone } from "lucide-react";
import { saveNotificationsAction } from "@/app/business/parametres/actions";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_NOTIFICATIONS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_GROUPS,
  WEEK_DAYS,
  type NotificationChannel,
  type NotificationSettings,
} from "@/types/org-settings";
import { Panel } from "../ui";
import { Switch } from "./controls";
import { SoonBadge } from "./rows";

const CHANNEL_ICONS = { inApp: Monitor, email: Mail, sms: Smartphone } as const;
const TIMES = Array.from(
  { length: 48 },
  (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
);
const select = "border-border h-11 w-full rounded-xl border bg-white px-3 text-sm";

export function NotificationsTab({
  initial,
  timezone,
  canEdit,
}: {
  initial: NotificationSettings;
  timezone: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<NotificationSettings>(initial);
  const [view, setView] = useState<"prefs" | "summary">("prefs");
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const change = (next: NotificationSettings) => {
    setSaved(false);
    setValue(next);
  };
  const toggle = (key: string, channel: NotificationChannel, on: boolean) =>
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

  const totals = NOTIFICATION_CHANNELS.map((c) => ({
    channel: c,
    count: Object.values(value.matrix).filter((m) => m[c]).length,
  }));
  const eventCount = Object.keys(value.matrix).length;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Panel className="min-w-0 p-5">
        <div className="border-border/60 flex flex-wrap gap-6 border-b">
          {(
            [
              ["prefs", "Préférences"],
              ["summary", "Résumé"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={cn(
                "-mb-px border-b-2 px-1 py-3 text-sm font-medium",
                view === key ? "border-brand text-brand font-semibold" : "text-navy border-transparent",
              )}
            >
              {label}
            </button>
          ))}
          {["Destinataires", "Modèles"].map((label) => (
            <span key={label} className="text-muted -mb-px flex items-center gap-2 px-1 py-3 text-sm">
              {label} <SoonBadge />
            </span>
          ))}
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Vos préférences sont enregistrées dès maintenant. L&apos;envoi des notifications par e-mail et SMS
          sera activé dans une prochaine étape.
        </p>

        {view === "prefs" ? (
          <>
            <h2 className="text-navy mt-5 text-lg font-bold">Préférences de notification</h2>
            <p className="text-muted text-sm">
              Choisissez comment et quand vous souhaitez être notifié des activités de votre organisation.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="text-navy bg-slate-50 text-xs font-semibold">
                    <th scope="col" className="px-3 py-2.5">
                      Type de notification
                    </th>
                    {NOTIFICATION_CHANNELS.map((c) => {
                      const Icon = CHANNEL_ICONS[c];
                      return (
                        <th key={c} scope="col" className="w-24 px-3 py-2.5 text-center">
                          <span className="flex items-center justify-center gap-1.5">
                            <Icon className="size-3.5" aria-hidden /> {NOTIFICATION_CHANNEL_LABELS[c]}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                {NOTIFICATION_GROUPS.map((g) => (
                  <tbody key={g.title} className="divide-y divide-slate-100">
                    <tr>
                      <th scope="rowgroup" colSpan={4} className="text-navy px-3 pt-4 pb-1 text-sm font-bold">
                        {g.title}
                      </th>
                    </tr>
                    {g.events.map((e) => (
                      <tr key={e.key}>
                        <td className="px-3 py-2.5">
                          <span className="text-navy block font-semibold">{e.title}</span>
                          <span className="text-muted block text-xs">{e.text}</span>
                        </td>
                        {NOTIFICATION_CHANNELS.map((c) => (
                          <td key={c} className="px-3 py-2.5 text-center">
                            <Switch
                              checked={value.matrix[e.key]?.[c] ?? false}
                              onChange={(on) => toggle(e.key, c, on)}
                              label={`${e.title} : ${NOTIFICATION_CHANNEL_LABELS[c]}`}
                              disabled={!canEdit}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          </>
        ) : (
          <div className="mt-5">
            <h2 className="text-navy text-lg font-bold">Résumé</h2>
            <p className="text-muted text-sm">Combien de notifications sont activées sur chaque canal.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {totals.map(({ channel, count }) => {
                const Icon = CHANNEL_ICONS[channel];
                return (
                  <li key={channel} className="border-border/70 rounded-xl border p-4">
                    <Icon className="text-brand size-5" aria-hidden />
                    <p className="text-navy mt-2 text-2xl font-bold">
                      {count}
                      <span className="text-muted text-sm font-normal"> / {eventCount}</span>
                    </p>
                    <p className="text-muted text-xs">{NOTIFICATION_CHANNEL_LABELS[channel]}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error && (
          <p role="alert" className="text-danger mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Préférences enregistrées.
          </p>
        )}
        {canEdit && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                change({ ...DEFAULT_NOTIFICATIONS, matrix: structuredClone(DEFAULT_NOTIFICATIONS.matrix) })
              }
              className="border-brand/40 text-brand flex h-11 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-semibold hover:bg-blue-50"
            >
              <RotateCcw className="size-4" aria-hidden /> Réinitialiser par défaut
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="bg-brand flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="size-4" aria-hidden />{" "}
              {pending ? "Enregistrement…" : "Enregistrer les préférences"}
            </button>
          </div>
        )}
      </Panel>

      <aside className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-navy flex items-center gap-2 font-bold">
            Tester une notification <SoonBadge />
          </h2>
          <p className="text-muted mt-1 text-sm">
            Envoyez une notification de test pour vérifier vos paramètres.
          </p>
        </Panel>

        <Panel className="p-5">
          <h2 className="text-navy font-bold">Heures de réception</h2>
          <p className="text-muted text-sm">
            Définissez les plages horaires pendant lesquelles vous souhaitez recevoir des notifications.
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-navy text-sm font-medium">Limiter aux heures de travail</span>
            <Switch
              checked={value.workHoursOnly}
              onChange={(on) => change({ ...value, workHoursOnly: on })}
              label="Limiter aux heures de travail"
              disabled={!canEdit}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-xs font-medium">
              Heure de début
              <select
                value={value.start}
                disabled={!canEdit || !value.workHoursOnly}
                onChange={(e) => change({ ...value, start: e.target.value })}
                className={`${select} mt-1 disabled:bg-slate-50`}
              >
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium">
              Heure de fin
              <select
                value={value.end}
                disabled={!canEdit || !value.workHoursOnly}
                onChange={(e) => change({ ...value, end: e.target.value })}
                className={`${select} mt-1 disabled:bg-slate-50`}
              >
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-muted mt-3 text-xs">Fuseau horaire : {timezone} (modifiable dans Général).</p>
          <p className="text-navy mt-4 text-sm font-medium">Jours actifs</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEK_DAYS.map(([day, label]) => {
              const on = value.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  disabled={!canEdit || !value.workHoursOnly}
                  onClick={() =>
                    change({
                      ...value,
                      days: on ? value.days.filter((d) => d !== day) : [...value.days, day],
                    })
                  }
                  className={cn(
                    "size-9 rounded-full text-xs font-semibold disabled:opacity-50",
                    on ? "bg-brand text-white" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="rounded-2xl bg-blue-50 p-5 text-sm">
          <p className="text-brand font-bold">Bon à savoir</p>
          <p className="text-muted mt-1">
            Les notifications vous permettent de ne rien manquer des opportunités, des talents et des
            activités importantes de votre organisation.
          </p>
        </div>
      </aside>
    </div>
  );
}
