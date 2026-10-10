"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileBarChart2, MailCheck, UserCheck, UserRoundPlus, Wrench } from "lucide-react";
import { setMaintenanceAction } from "@/app/business/parametres/actions";
import { Panel } from "../ui";
import { SettingRow } from "./rows";
import { Switch } from "./controls";

/** The switches of the "Paramètres rapides" card. Only maintenance mode does anything today. */
export function QuickSettings({
  maintenance,
  canEdit,
  showMaintenance,
}: {
  maintenance: boolean;
  canEdit: boolean;
  /** Maintenance mode is a platform setting: only the general administrator of SkillPass gets the switch. */
  showMaintenance: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(maintenance);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setError(undefined);
    setOn(next);
    startTransition(async () => {
      const result = await setMaintenanceAction({ maintenance: next });
      if (result.error) {
        setOn(!next);
        setError(result.error);
      } else router.refresh();
    });
  }

  return (
    <Panel className="p-5">
      <h2 className="text-navy font-bold">Paramètres rapides</h2>
      <p className="text-muted text-sm">Configurez rapidement les options essentielles.</p>
      <div className="mt-2 divide-y divide-slate-100">
        <SettingRow
          icon={UserRoundPlus}
          title="Candidatures des talents"
          text="Permettre aux talents de postuler aux offres"
          soon
        >
          <Switch checked label="Candidatures des talents" disabled />
        </SettingRow>
        <SettingRow
          icon={UserCheck}
          title="Validation des nouveaux membres"
          text="Approuver les invitations par un administrateur"
          soon
        >
          <Switch checked={false} label="Validation des nouveaux membres" disabled />
        </SettingRow>
        <SettingRow
          icon={MailCheck}
          title="Notifications par e-mail"
          text="Recevoir les notifications importantes"
          soon
        >
          <Switch checked={false} label="Notifications par e-mail" disabled />
        </SettingRow>
        <SettingRow
          icon={FileBarChart2}
          title="Rapports automatiques"
          text="Recevoir un résumé hebdomadaire"
          soon
        >
          <Switch checked={false} label="Rapports automatiques" disabled />
        </SettingRow>
        {showMaintenance && (
          <SettingRow icon={Wrench} title="Mode maintenance" text="Réserver l'accès aux administrateurs">
            <Switch checked={on} onChange={toggle} label="Mode maintenance" disabled={!canEdit || pending} />
          </SettingRow>
        )}
      </div>
      {error && (
        <p role="alert" className="text-danger mt-2 text-sm">
          {error}
        </p>
      )}
    </Panel>
  );
}
