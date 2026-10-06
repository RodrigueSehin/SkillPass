"use client";

import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Bookmark, BookmarkCheck, Check, Copy, ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import {
  createJobAlertAction,
  deleteJobAlertAction,
  toggleSaveOpportunityAction,
} from "@/app/dashboard/opportunities/actions";
import { CompanyLogo } from "@/components/opportunities/company-logo";
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
  openOffer: (offer: OfferView) => void;
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

function OfferDialog({ offer, onClose }: { offer: OfferView | null; onClose: () => void }) {
  const { saved, toggleSave, pending } = useOpportunities();
  const [copied, setCopied] = useState(false);
  const isSaved = offer ? saved.has(offer.id) : false;

  async function copyLink() {
    if (!offer) return;
    const url = `${window.location.origin}/dashboard/opportunities?offer=${offer.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", url);
    }
  }

  return (
    <Modal open={offer !== null} onClose={onClose} title={offer?.title ?? "Offre"}>
      {offer && (
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="flex items-center gap-3">
            <CompanyLogo company={offer.company} />
            <div>
              <p className="text-navy font-bold">{offer.companyName}</p>
              <p className="text-muted text-sm">
                {offer.location} · Publié {offer.published}
              </p>
            </div>
            <span className="text-brand ml-auto rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold">
              {offer.match}% de correspondance
            </span>
          </div>
          <ul className="flex flex-wrap gap-2 text-xs font-semibold">
            <li className="text-brand rounded-full bg-blue-50 px-3 py-1">{offer.badge}</li>
            {offer.workMode && <li className="rounded-full bg-slate-100 px-3 py-1">{offer.workMode}</li>}
            {offer.commitment && <li className="rounded-full bg-slate-100 px-3 py-1">{offer.commitment}</li>}
            <li className="rounded-full bg-slate-100 px-3 py-1">{offer.domain}</li>
            <li className="rounded-full bg-slate-100 px-3 py-1">{offer.levelLabel}</li>
          </ul>
          <p className="text-navy/85 text-sm leading-relaxed whitespace-pre-line">{offer.description}</p>
          <div>
            <p className="text-navy mb-2 text-sm font-bold">Compétences demandées</p>
            <ul className="flex flex-wrap gap-2">
              {offer.skills.map((s) => (
                <li
                  key={s.name}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium",
                    s.owned ? "bg-green-50 text-green-700" : "text-brand bg-blue-50",
                  )}
                >
                  {s.owned && <Check className="size-3" aria-label="Vous maîtrisez cette compétence" />}{" "}
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            {offer.applyUrl ? (
              <a
                href={offer.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "primary" })}
              >
                Postuler <ExternalLink />
              </a>
            ) : (
              <p className="text-muted w-full text-xs">
                Offre de démonstration : aucun lien de candidature n&apos;est associé.
              </p>
            )}
            <Button variant="outline" disabled={pending} onClick={() => toggleSave(offer.id)}>
              {isSaved ? <BookmarkCheck /> : <Bookmark />} {isSaved ? "Enregistrée" : "Enregistrer"}
            </Button>
            <Button variant="outline" onClick={copyLink}>
              {copied ? <Check /> : <Copy />} {copied ? "Lien copié" : "Copier le lien"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Owns the offer dialog, the alerts dialog and the "saved" state shared by every card. */
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
  const [offer, setOffer] = useState<OfferView | null>(null);
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
      value={{ saved, toggleSave, openOffer: setOffer, openAlerts: () => setAlertsOpen(true), pending }}
    >
      {children}
      {error && (
        <p role="alert" className="text-danger mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <OfferDialog offer={offer} onClose={() => setOffer(null)} />
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

/** Opens an offer on arrival (shared "Copier le lien" URLs). */
export function AutoOpenOffer({ offer }: { offer: OfferView }) {
  const { openOffer } = useOpportunities();
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    openOffer(offer);
  }, [offer, openOffer]);
  return null;
}

export function OfferMenu({ offer }: { offer: OfferView }) {
  const { saved, toggleSave, openOffer } = useOpportunities();
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
    const url = `${window.location.origin}/dashboard/opportunities?offer=${offer.id}`;
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
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              setOpen(false);
              openOffer(offer);
            }}
          >
            <ExternalLink className="size-4" aria-hidden /> Voir l&apos;offre
          </button>
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
  const { saved, toggleSave, openOffer, pending } = useOpportunities();
  const isSaved = saved.has(offer.id);
  return (
    <div className="mt-auto flex gap-2 pt-4">
      <Button
        variant="outline"
        className="text-brand border-brand/40 h-10 flex-1"
        onClick={() => openOffer(offer)}
      >
        Voir l&apos;offre
      </Button>
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
