"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { removeMemberAction, resendInvitationAction, updateMemberAction } from "@/app/business/actions";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";
import { MEMBER_STATUS_LABELS, ORG_ROLE_LABELS, type MemberStatus, type OrgRole } from "@/types/business";
import { PermissionsEditor } from "./permissions-editor";
import { RowMenu, type RowMenuItem } from "./row-menu";
import { MemberAvatar, RolePill, StatusPill } from "./ui";

export interface MemberRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: OrgRole;
  permissions: string[];
  status: MemberStatus;
  team: string | null;
  activity: string;
  /** The signed-in person: they cannot deactivate or remove themselves. */
  isSelf: boolean;
}

function LinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={link}
        aria-label="Lien d'invitation"
        onFocus={(e) => e.currentTarget.select()}
        className="border-border h-10 min-w-0 flex-1 rounded-lg border bg-slate-50 px-3 font-mono text-xs"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copiez ce lien :", link);
          }
        }}
      >
        {copied ? <Check /> : <Copy />} {copied ? "Copié" : "Copier"}
      </Button>
    </div>
  );
}

/**
 * Members of the organization with their actions: change role, deactivate, remove, resend the invitation.
 * Rows may also be ticked to deactivate or reactivate several people at once.
 */
export function MembersTable({
  rows,
  canEdit,
  showCheckboxes = true,
  emptyLabel = "Aucun membre ne correspond à vos critères.",
}: {
  rows: MemberRow[];
  canEdit: boolean;
  showCheckboxes?: boolean;
  emptyLabel?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [draft, setDraft] = useState<{ role: OrgRole; permissions: string[] }>({
    role: "VIEWER",
    permissions: [],
  });
  const [removing, setRemoving] = useState<MemberRow | null>(null);
  const [link, setLink] = useState<{ name: string; value: string } | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const done = () => router.refresh();
  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      setError(undefined);
      const result = await fn();
      if (result.error) setError(result.error);
      done();
    });

  function menuFor(m: MemberRow): RowMenuItem[] {
    if (!canEdit) return [];
    if (m.status === "INVITED") {
      return [
        {
          label: "Renvoyer l'invitation",
          onSelect: () =>
            run(async () => {
              const result = await resendInvitationAction(m.id);
              if (result.link) setLink({ name: `${m.firstName} ${m.lastName}`, value: result.link });
              return result;
            }),
        },
        { label: "Annuler l'invitation", danger: true, onSelect: () => setRemoving(m) },
      ];
    }
    return [
      {
        label: "Modifier le rôle",
        onSelect: () => {
          setDraft({ role: m.role, permissions: m.permissions });
          setEditing(m);
        },
      },
      {
        label: m.status === "ACTIVE" ? "Désactiver" : "Réactiver",
        disabled: m.isSelf && m.status === "ACTIVE",
        onSelect: () =>
          run(() => updateMemberAction(m.id, { status: m.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })),
      },
      {
        label: "Retirer de l'organisation",
        danger: true,
        disabled: m.isSelf,
        onSelect: () => setRemoving(m),
      },
    ];
  }

  const selectable = rows.filter((r) => r.status !== "INVITED");
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.includes(r.id));
  const chosen = rows.filter((r) => selected.includes(r.id));

  async function bulk(status: "ACTIVE" | "INACTIVE") {
    const failures: string[] = [];
    for (const m of chosen) {
      if (m.status === status || (m.isSelf && status === "INACTIVE")) continue;
      const result = await updateMemberAction(m.id, { status });
      if (result.error) failures.push(result.error);
    }
    setSelected([]);
    return failures.length ? { error: failures[0] } : {};
  }

  if (rows.length === 0) return <p className="text-muted px-5 py-10 text-center text-sm">{emptyLabel}</p>;

  return (
    <>
      {canEdit && showCheckboxes && selected.length > 0 && (
        <div className="mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-blue-50 px-4 py-2.5 text-sm">
          <span className="text-navy font-semibold">
            {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
          </span>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => bulk("INACTIVE"))}>
            Désactiver
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => bulk("ACTIVE"))}>
            Réactiver
          </Button>
          <button
            type="button"
            className="text-brand ml-auto font-semibold hover:underline"
            onClick={() => setSelected([])}
          >
            Tout désélectionner
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-danger mx-4 mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="text-navy border-y border-slate-100 text-xs font-semibold">
              {showCheckboxes && (
                <th scope="col" className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    checked={allSelected}
                    disabled={!canEdit || selectable.length === 0}
                    onChange={() => setSelected(allSelected ? [] : selectable.map((r) => r.id))}
                    className="accent-brand size-4 rounded"
                  />
                </th>
              )}
              <th scope="col" className="px-3 py-3">
                Membre
              </th>
              <th scope="col" className="px-3 py-3">
                Rôle
              </th>
              <th scope="col" className="px-3 py-3">
                Équipe
              </th>
              <th scope="col" className="px-3 py-3">
                Statut
              </th>
              <th scope="col" className="px-3 py-3">
                Dernière activité
              </th>
              <th scope="col" className="px-3 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((m) => (
              <tr key={m.id} className={cn(selected.includes(m.id) && "bg-blue-50/40")}>
                {showCheckboxes && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${m.firstName} ${m.lastName}`}
                      checked={selected.includes(m.id)}
                      disabled={!canEdit || m.status === "INVITED"}
                      onChange={() =>
                        setSelected((s) => (s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]))
                      }
                      className="accent-brand size-4 rounded"
                    />
                  </td>
                )}
                <td className="px-3 py-3">
                  <span className="flex items-center gap-3">
                    <MemberAvatar member={m} />
                    <span className="min-w-0">
                      <span className="text-navy block font-semibold">
                        {m.firstName} {m.lastName}
                      </span>
                      <span className="text-muted block truncate text-xs">{m.email}</span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3">
                  <RolePill role={m.role} label={ORG_ROLE_LABELS[m.role]} />
                </td>
                <td className="text-navy px-3 py-3">{m.team ?? "—"}</td>
                <td className="px-3 py-3">
                  <StatusPill status={m.status} label={MEMBER_STATUS_LABELS[m.status]} />
                </td>
                <td className="text-muted px-3 py-3 whitespace-nowrap">{m.activity}</td>
                <td className="px-3 py-3 text-right">
                  {canEdit && (
                    <RowMenu label={`Actions pour ${m.firstName} ${m.lastName}`} items={menuFor(m)} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={`Rôle de ${editing?.firstName ?? ""} ${editing?.lastName ?? ""}`}
      >
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <PermissionsEditor
            role={draft.role}
            permissions={draft.permissions}
            onChange={(role, permissions) => setDraft({ role, permissions })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const result = editing ? await updateMemberAction(editing.id, draft) : {};
                  if (!("error" in result && result.error)) setEditing(null);
                  return result;
                })
              }
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={removing?.status === "INVITED" ? "Annuler cette invitation ?" : "Retirer ce membre ?"}
      >
        <p className="text-muted text-sm">
          {removing?.status === "INVITED"
            ? `Le lien envoyé à ${removing.email} ne fonctionnera plus.`
            : `${removing?.firstName} ${removing?.lastName} n'aura plus accès à l'organisation.`}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setRemoving(null)}>
            Annuler
          </Button>
          <Button
            className="bg-danger hover:bg-red-700"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const target = removing;
                setRemoving(null);
                return target ? removeMemberAction(target.id) : {};
              })
            }
          >
            {pending ? "Suppression…" : removing?.status === "INVITED" ? "Annuler l'invitation" : "Retirer"}
          </Button>
        </div>
      </Modal>

      <Modal open={link !== null} onClose={() => setLink(null)} title="Nouveau lien d'invitation">
        <div className="space-y-4">
          <p className="text-muted text-sm">
            Envoyez ce nouveau lien à <strong className="text-navy">{link?.name}</strong>. L&apos;ancien lien
            ne fonctionne plus ; celui-ci est valable 7 jours.
          </p>
          {link && <LinkBox link={link.value} />}
          <div className="flex justify-end">
            <Button onClick={() => setLink(null)}>Terminer</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
