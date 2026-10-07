"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Plus } from "lucide-react";
import { deleteSiteAction, saveSiteAction } from "@/app/business/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { RowMenu } from "./row-menu";
import { Panel } from "./ui";

export interface SiteView {
  id: string;
  name: string;
  address: string | null;
  members: number;
}

const field =
  "border-border focus-visible:ring-brand/40 h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus-visible:ring-2";

/** Sites and locations: the compact card of the overview, or the full list of its own tab. */
export function SitesPanel({
  sites,
  canEdit,
  compact = false,
}: {
  sites: SiteView[];
  canEdit: boolean;
  /** The overview card shows the first sites and links to the full list. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<SiteView | "new" | null>(null);
  const [deleting, setDeleting] = useState<SiteView | null>(null);
  const [values, setValues] = useState({ name: "", address: "" });
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const shown = compact ? sites.slice(0, 3) : sites;

  function open(site: SiteView | "new") {
    setError(undefined);
    setValues(site === "new" ? { name: "", address: "" } : { name: site.name, address: site.address ?? "" });
    setEditing(site);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (values.name.trim().length < 2) return setError("Nom trop court");
    startTransition(async () => {
      const result = await saveSiteAction(editing === "new" || editing === null ? null : editing.id, values);
      if (result.error) setError(result.error);
      else {
        setEditing(null);
        router.refresh();
      }
    });
  }

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-navy font-bold">Sites / Localisations</h2>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="border-brand/40 text-brand"
            onClick={() => open("new")}
          >
            <Plus /> Ajouter un site
          </Button>
        )}
      </div>
      {sites.length === 0 ? (
        <p className="text-muted mt-4 text-sm">Aucun site pour l&apos;instant.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {shown.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <span className="text-navy flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Building2 className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-navy truncate text-sm font-semibold">{s.name}</p>
                {s.address && <p className="text-muted truncate text-xs">{s.address}</p>}
              </div>
              <span className="text-brand shrink-0 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold">
                {s.members} membre{s.members > 1 ? "s" : ""}
              </span>
              {canEdit && (
                <RowMenu
                  label={`Actions pour ${s.name}`}
                  items={[
                    { label: "Modifier", onSelect: () => open(s) },
                    { label: "Supprimer", danger: true, onSelect: () => setDeleting(s) },
                  ]}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {compact && sites.length > shown.length && (
        <Link
          href="/business/organisation?tab=sites"
          className="text-brand border-brand/40 mt-3 inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold hover:bg-blue-50"
        >
          Voir tous les sites <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Ajouter un site" : "Modifier le site"}
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-name">Nom du site</Label>
            <input
              id="site-name"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              placeholder="Ex : Siège - Abidjan"
              className={field}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site-address">Adresse</Label>
            <input
              id="site-address"
              value={values.address}
              onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
              placeholder="Ex : Riviera Palmeraie, Abidjan"
              className={field}
            />
          </div>
          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer ce site ?">
        <p className="text-muted text-sm">
          « {deleting?.name} » sera retiré de l&apos;organisation. Les membres et départements qui y étaient
          rattachés n&apos;auront plus de site.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Annuler
          </Button>
          <Button
            className="bg-danger hover:bg-red-700"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (deleting) await deleteSiteAction(deleting.id);
                setDeleting(null);
                router.refresh();
              })
            }
          >
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </Modal>
    </Panel>
  );
}
