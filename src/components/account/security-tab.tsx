"use client";

import { useState, useTransition } from "react";
import { Check, Info, KeyRound, LogOut, MonitorSmartphone, ShieldCheck, Smartphone } from "lucide-react";
import { changePasswordAction, signOutEverywhereAction } from "@/app/dashboard/settings/actions";
import { Switch } from "@/components/business/settings/controls";
import { SettingRow } from "@/components/business/settings/rows";
import { Panel } from "@/components/business/ui";

const field =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus-visible:ring-2";

const RULES = ["8 caractères minimum", "Au moins une lettre majuscule", "Au moins un chiffre"];

export function SecurityTab({ canChange }: { canChange: boolean }) {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setDone(false);
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (result.error) setError(result.error);
      else {
        setDone(true);
        setValues({ current: "", next: "", confirm: "" });
      }
    });
  }

  const input = (name: keyof typeof values, label: string, autoComplete: string) => (
    <div>
      <label htmlFor={`pw-${name}`} className="text-navy mb-1 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={`pw-${name}`}
        type="password"
        autoComplete={autoComplete}
        value={values[name]}
        onChange={(e) => {
          setDone(false);
          setValues((v) => ({ ...v, [name]: e.target.value }));
        }}
        className={field}
      />
    </div>
  );

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Panel className="p-6">
          <h2 className="text-navy flex items-center gap-2 text-lg font-bold">
            <KeyRound className="text-brand size-5" aria-hidden /> Mot de passe
          </h2>
          <p className="text-muted text-sm">Changez votre mot de passe. Il faut saisir l&apos;actuel.</p>
          <form onSubmit={submit} className="mt-4 max-w-md space-y-4">
            {input("current", "Mot de passe actuel", "current-password")}
            {input("next", "Nouveau mot de passe", "new-password")}
            {input("confirm", "Confirmer le nouveau mot de passe", "new-password")}
            {error && (
              <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
                {error}
              </p>
            )}
            {done && (
              <p role="status" className="text-success rounded-lg bg-green-50 px-3 py-2 text-sm">
                Mot de passe modifié.
              </p>
            )}
            {!canChange && (
              <p className="text-muted text-sm">
                Votre compte est connecté via un fournisseur externe ou l&apos;authentification n&apos;est pas
                configurée ici.
              </p>
            )}
            <button
              type="submit"
              disabled={pending || !canChange}
              className="bg-brand h-11 rounded-xl px-6 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "Enregistrement…" : "Changer le mot de passe"}
            </button>
          </form>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-navy flex items-center gap-2 text-lg font-bold">
            <ShieldCheck className="text-brand size-5" aria-hidden /> Authentification et sessions
          </h2>
          <div className="mt-2 divide-y divide-slate-100">
            <SettingRow
              icon={Smartphone}
              title="Authentification à deux facteurs"
              text="Demander un code en plus du mot de passe."
              soon
            >
              <Switch checked={false} label="Authentification à deux facteurs" disabled />
            </SettingRow>
            <SettingRow
              icon={MonitorSmartphone}
              title="Sessions actives"
              text="Voir et fermer vos sessions une par une."
              soon
            >
              <Switch checked={false} label="Sessions actives" disabled />
            </SettingRow>
            <SettingRow
              icon={LogOut}
              title="Se déconnecter partout"
              text="Ferme toutes vos sessions, sur tous vos appareils, y compris celle-ci."
            >
              <form action={signOutEverywhereAction}>
                <button
                  type="submit"
                  className="border-brand/40 text-brand h-10 rounded-xl border bg-white px-4 text-sm font-semibold hover:bg-blue-50"
                >
                  Déconnecter
                </button>
              </form>
            </SettingRow>
          </div>
        </Panel>
      </div>

      <aside className="space-y-6">
        <Panel className="p-5">
          <h2 className="text-navy font-bold">Règles de mot de passe</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {RULES.map((r) => (
              <li key={r} className="flex items-center gap-2">
                <Check className="size-4 rounded-full bg-green-600 p-0.5 text-white" aria-hidden /> {r}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="bg-blue-50/60 p-5">
          <p className="text-navy flex items-center gap-2 font-bold">
            <Info className="text-brand size-5" aria-hidden /> Bon à savoir
          </p>
          <p className="text-navy/80 mt-2 text-sm">
            Un mot de passe unique, que vous n&apos;utilisez nulle part ailleurs, protège votre passeport de
            compétences.
          </p>
        </Panel>
      </aside>
    </div>
  );
}
