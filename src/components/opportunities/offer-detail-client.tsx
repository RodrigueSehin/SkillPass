"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { Bookmark, BookmarkCheck, CheckCircle2, ClipboardCheck, Send, Share2, Star } from "lucide-react";
import { applyToOpportunityAction, toggleSaveOpportunityAction } from "@/app/dashboard/opportunities/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";

interface Ctx {
  saved: Set<string>;
  toggleSave: (id: string) => void;
  applied: boolean;
  openApply: () => void;
  pending: boolean;
}

const DetailContext = createContext<Ctx | null>(null);

function useDetail() {
  const ctx = useContext(DetailContext);
  if (!ctx) throw new Error("Offer controls must be rendered inside <DetailProvider>");
  return ctx;
}

const MAX_MESSAGE = 500;

/** Owns the "saved" state of this offer and of the similar ones, and the application dialog. */
export function DetailProvider({
  offerId,
  offerTitle,
  companyName,
  initialSaved,
  initiallyApplied,
  children,
}: {
  offerId: string;
  offerTitle: string;
  companyName: string;
  initialSaved: string[];
  initiallyApplied: boolean;
  children: React.ReactNode;
}) {
  const [saved, setSaved] = useState(() => new Set(initialSaved));
  const [applied, setApplied] = useState(initiallyApplied);
  const [applyOpen, setApplyOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggleSave(id: string) {
    setError(undefined);
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

  function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await applyToOpportunityAction(offerId, { message });
      if (result.error) setError(result.error);
      else {
        setApplied(true);
        setApplyOpen(false);
      }
    });
  }

  return (
    <DetailContext.Provider
      value={{ saved, toggleSave, applied, openApply: () => setApplyOpen(true), pending }}
    >
      {children}
      {error && !applyOpen && (
        <p role="alert" className="text-danger mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title="Candidature simplifiée">
        <form onSubmit={submitApplication} noValidate className="space-y-4">
          <p className="text-sm">
            Vous postulez à <strong className="text-navy">{offerTitle}</strong> chez{" "}
            <strong className="text-navy">{companyName}</strong> avec votre profil SkillPass : compétences,
            expériences, projets et certifications.
          </p>
          <div className="space-y-2">
            <Label htmlFor="application-message">Message pour le recruteur (optionnel)</Label>
            <div className="relative">
              <textarea
                id="application-message"
                rows={5}
                maxLength={MAX_MESSAGE}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Présentez-vous en quelques mots et expliquez ce qui vous motive dans ce poste…"
                className="border-border focus-visible:ring-brand/40 w-full resize-none rounded-xl border bg-white px-4 py-3 pb-7 text-sm outline-none focus-visible:ring-2"
              />
              <span className="text-muted absolute right-3 bottom-2 text-xs">
                {message.length}/{MAX_MESSAGE}
              </span>
            </div>
          </div>
          <p className="text-muted rounded-lg bg-slate-50 px-3 py-2 text-xs">
            Votre candidature est enregistrée sur SkillPass. Les entreprises n&apos;ont pas encore
            d&apos;espace de réception : vous ne recevrez pas de réponse automatique.
          </p>
          {error && (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              <Send /> {pending ? "Envoi…" : "Envoyer ma candidature"}
            </Button>
          </div>
        </form>
      </Modal>
    </DetailContext.Provider>
  );
}

/** "hero": translucent button on the dark banner. "square": icon only. "plain": small bookmark of a list row. */
export function SaveButton({
  id,
  title,
  variant,
}: {
  id: string;
  title: string;
  variant: "hero" | "square" | "plain";
}) {
  const { saved, toggleSave, pending } = useDetail();
  const on = saved.has(id);
  const Icon = on ? BookmarkCheck : Bookmark;

  if (variant === "hero") {
    return (
      <button
        type="button"
        aria-pressed={on}
        disabled={pending}
        onClick={() => toggleSave(id)}
        className="flex h-11 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20"
      >
        <Star className={cn("size-4", on && "fill-current")} aria-hidden />{" "}
        {on ? "Enregistrée" : "Enregistrer"}
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-label={on ? `Retirer ${title} des offres enregistrées` : `Enregistrer ${title}`}
      aria-pressed={on}
      disabled={pending}
      onClick={() => toggleSave(id)}
      className={cn(
        variant === "square"
          ? "border-brand/40 flex size-12 shrink-0 items-center justify-center rounded-xl border"
          : "rounded-md p-1.5",
        on ? (variant === "square" ? "bg-brand text-white" : "text-brand") : "text-navy hover:bg-blue-50",
      )}
    >
      <Icon className={variant === "square" ? "size-5" : "size-4"} />
    </button>
  );
}

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copiez ce lien :", window.location.href);
        }
      }}
      className="flex h-11 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20"
    >
      <Share2 className="size-4" aria-hidden /> {copied ? "Lien copié" : "Partager"}
    </button>
  );
}

export function ApplyBar({
  offerId,
  title,
  applyUrl,
}: {
  offerId: string;
  title: string;
  applyUrl: string | null;
}) {
  const { applied, openApply } = useDetail();
  return (
    <div className="border-border/60 shadow-soft flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4">
      <SaveButton id={offerId} title={title} variant="square" />
      {applied ? (
        <p role="status" className="text-success ml-auto flex h-12 items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="size-5" aria-hidden /> Candidature envoyée avec votre profil SkillPass
        </p>
      ) : (
        <div className="ml-auto flex min-w-0 flex-1 flex-wrap gap-3 sm:flex-initial sm:flex-nowrap">
          {applyUrl ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-brand text-brand flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-6 text-sm font-semibold hover:bg-blue-50 sm:w-72 sm:flex-none"
            >
              <Send className="size-4" aria-hidden /> Postuler maintenant
            </a>
          ) : (
            <button
              type="button"
              onClick={openApply}
              className="border-brand text-brand flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-6 text-sm font-semibold hover:bg-blue-50 sm:w-72 sm:flex-none"
            >
              <Send className="size-4" aria-hidden /> Postuler maintenant
            </button>
          )}
          <button
            type="button"
            onClick={openApply}
            className="bg-brand flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-white hover:bg-blue-700 sm:w-72 sm:flex-none"
          >
            <ClipboardCheck className="size-4" aria-hidden /> Candidature simplifiée
          </button>
        </div>
      )}
    </div>
  );
}

export const DETAIL_TABS = [
  ["overview", "Vue d'ensemble"],
  ["company", "À propos de l'entreprise"],
  ["role", "Le poste"],
  ["profile", "Profil recherché"],
  ["perks", "Avantages"],
  ["process", "Processus"],
] as const;
export type DetailTab = (typeof DETAIL_TABS)[number][0];

/** Tab strip and the active panel. The panels are rendered on the server and passed in. */
export function DetailTabs({ panels }: { panels: Record<DetailTab, React.ReactNode> }) {
  const [tab, setTab] = useState<DetailTab>("overview");
  return (
    <div>
      <div
        role="tablist"
        aria-label="Sections de l'offre"
        className="border-border/60 flex gap-6 overflow-x-auto border-b px-2"
      >
        {DETAIL_TABS.map(([key, label]) => (
          <button
            key={key}
            id={`tab-${key}`}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-controls="detail-panel"
            onClick={() => setTab(key)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-1 py-4 text-sm font-medium transition-colors",
              tab === key
                ? "border-brand text-brand font-semibold"
                : "text-navy hover:text-brand border-transparent",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div id="detail-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-5">
        {panels[tab]}
      </div>
    </div>
  );
}
