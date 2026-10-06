"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Bookmark, BookmarkCheck, Check, Copy, ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import {
  createJobAlertAction,
  deleteJobAlertAction,
  toggleSaveOpportunityAction,
} from "@/app/dashboard/opportunities/actions";
import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";
import {
  OPPORTUNITY_KINDS,
  OPPORTUNITY_KIND_LABELS,
  OPPORTUNITY_LEVELS,
  OPPORTUNITY_LEVEL_LABELS,
  OPPORTUNITY_REGIONS,
  OPPORTUNITY_REGION_LABELS,
} from "@/types/opportunity";

/** Everything the dialogs need about an offer, prepared on the server. */
export interface OfferView {
  id: string;
  title: string;
  company: string;
  companyName: string;
  badge: string;
  location: string;
  workMode: string | null;
  commitment: string | null;
  domain: string;
  levelLabel: string;
  skills: { name: string; owned: boolean }[];
  description: string;
  applyUrl: string | null;
  published: string;
  match: number;
}

export interface AlertView {
  id: string;
  name: string;
  /** Offers matching the alert right now. */
  count: number;
  href: string;
}

interface Ctx {
  saved: Set<string>;
  toggleSave: (id: string) => void;
  openAlerts: () => void;
  pending: boolean;
}

const OpportunityContext = createContext<Ctx | null>(null);

function useOpportunities() {
  const ctx = useContext(OpportunityContext);
  if (!ctx) throw new Error("Opportunity controls must be rendered inside <OpportunityProvider>");
  return ctx;
}

const selectClass = "border-border bg-surface h-11 w-full rounded-xl border px-4 text-sm";

function AlertsDialog({
  open,
  onClose,
  alerts,
  domains,
}: {
  open: boolean;
  onClose: () => void;
  alerts: AlertView[];
  domains: string[];
}) {
  const [values, setValues] = useState({ name: "", query: "", kind: "", region: "", domain: "", level: "" });
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await createJobAlertAction(values);
      if (result.error) setError(result.error);
      else setValues({ name: "", query: "", kind: "", region: "", domain: "", level: "" });
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Alertes emploi">
      <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        <p className="text-muted text-sm">
          Une alerte enregistre vos critères de recherche : retrouvez en un clic les offres qui y
          correspondent. SkillPass n&apos;envoie pas encore d&apos;e-mail.
        </p>
        <form onSubmit={submit} noValidate className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="alert-query">Mots-clés</Label>
            <input
              id="alert-query"
              value={values.query}
              onChange={set("query")}
              placeholder="Ex : Power Platform, data, chef de projet…"
              className={selectClass}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="alert-kind">Type</Label>
              <select id="alert-kind" value={values.kind} onChange={set("kind")} className={selectClass}>
                <option value="">Tous</option>
                {OPPORTUNITY_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {OPPORTUNITY_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-region">Localisation</Label>
              <select
                id="alert-region"
                value={values.region}
                onChange={set("region")}
                className={selectClass}
              >
                <option value="">Toutes</option>
                {OPPORTUNITY_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {OPPORTUNITY_REGION_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-domain">Domaine</Label>
              <select
                id="alert-domain"
                value={values.domain}
                onChange={set("domain")}
                className={selectClass}
              >
                <option value="">Tous</option>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-level">Niveau d&apos;expérience</Label>
              <select id="alert-level" value={values.level} onChange={set("level")} className={selectClass}>
                <option value="">Tous</option>
                {OPPORTUNITY_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {OPPORTUNITY_LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-name">Nom de l&apos;alerte (optionnel)</Label>
            <input id="alert-name" value={values.name} onChange={set("name")} className={selectClass} />
          </div>
          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              <Bell /> {pending ? "Création…" : "Créer l'alerte"}
            </Button>
          </div>
        </form>

        <div>
          <h3 className="text-navy text-sm font-bold">Mes alertes ({alerts.length})</h3>
          {alerts.length === 0 ? (
            <p className="text-muted mt-2 text-sm">Aucune alerte pour l&apos;instant.</p>
          ) : (
            <ul className="divide-border mt-2 divide-y">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5">
                  <Link
                    href={a.href}
                    onClick={onClose}
                    className="text-navy hover:text-brand min-w-0 flex-1 text-sm font-medium"
                  >
                    <span className="block truncate">{a.name}</span>
                    <span className="text-muted text-xs font-normal">
                      {a.count} offre{a.count > 1 ? "s" : ""} correspondante{a.count > 1 ? "s" : ""}
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`Supprimer l'alerte ${a.name}`}
                    onClick={() => startTransition(async () => void (await deleteJobAlertAction(a.id)))}
                    className="text-muted hover:text-danger rounded-md p-1.5"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Owns the alerts dialog and the "saved" state shared by every card. */
export function OpportunityProvider({
  initialSaved,
  alerts,
  domains,
  children,
}: {
  initialSaved: string[];
  alerts: AlertView[];
  domains: string[];
  children: React.ReactNode;
}) {
  const [saved, setSaved] = useState(() => new Set(initialSaved));
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggleSave(id: string) {
    setError(undefined);
    // Optimistic: the bookmark flips at once, and flips back if the server refuses.
    const flip = (on: boolean) =>
      setSaved((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    flip(!saved.has(id));
    startTransition(async () => {
      const result = await toggleSaveOpportunityAction(id);
      if (result.error) {
        flip(saved.has(id));
        setError(result.error);
      } else if (result.saved !== undefined) flip(result.saved);
    });
  }

  return (
    <OpportunityContext.Provider
      value={{ saved, toggleSave, openAlerts: () => setAlertsOpen(true), pending }}
    >
      {children}
      {error && (
        <p role="alert" className="text-danger mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <AlertsDialog
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={alerts}
        domains={domains}
      />
    </OpportunityContext.Provider>
  );
}

export function CreateAlertButton({
  variant,
  className,
  children = "Créer une alerte",
}: Pick<ButtonProps, "variant" | "className" | "children">) {
  const { openAlerts } = useOpportunities();
  return (
    <Button variant={variant} className={className} onClick={openAlerts}>
      <Bell /> {children}
    </Button>
  );
}

export function OfferMenu({ offer }: { offer: OfferView }) {
  const { saved, toggleSave } = useOpportunities();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function copyLink() {
    const url = `${window.location.origin}/dashboard/opportunities/${offer.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copiez ce lien :", url);
    }
  }

  const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Plus d'actions pour ${offer.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-muted rounded-md p-1 hover:bg-slate-100"
      >
        <MoreVertical className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="border-border shadow-lift absolute top-full right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border bg-white"
        >
          <Link role="menuitem" href={`/dashboard/opportunities/${offer.id}`} className={item}>
            <ExternalLink className="size-4" aria-hidden /> Voir l&apos;offre
          </Link>
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              toggleSave(offer.id);
              setOpen(false);
            }}
          >
            {saved.has(offer.id) ? (
              <BookmarkCheck className="size-4" aria-hidden />
            ) : (
              <Bookmark className="size-4" aria-hidden />
            )}
            {saved.has(offer.id) ? "Retirer des enregistrées" : "Enregistrer"}
          </button>
          <button role="menuitem" type="button" className={item} onClick={copyLink}>
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Lien copié" : "Copier le lien"}
          </button>
        </div>
      )}
    </div>
  );
}

export function OfferActions({ offer }: { offer: OfferView }) {
  const { saved, toggleSave, pending } = useOpportunities();
  const isSaved = saved.has(offer.id);
  return (
    <div className="mt-auto flex gap-2 pt-4">
      <Link
        href={`/dashboard/opportunities/${offer.id}`}
        className={cn(buttonVariants({ variant: "outline" }), "text-brand border-brand/40 h-10 flex-1")}
      >
        Voir l&apos;offre
      </Link>
      <button
        type="button"
        aria-label={isSaved ? `Retirer ${offer.title} des offres enregistrées` : `Enregistrer ${offer.title}`}
        aria-pressed={isSaved}
        disabled={pending}
        onClick={() => toggleSave(offer.id)}
        className={cn(
          "border-brand/40 flex size-10 shrink-0 items-center justify-center rounded-xl border",
          isSaved ? "bg-brand text-white" : "text-brand bg-white hover:bg-blue-50",
        )}
      >
        {isSaved ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
      </button>
    </div>
  );
}
