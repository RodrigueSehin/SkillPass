"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  deleteRecommendationAction,
  moderateRecommendationAction,
  requestRecommendationAction,
} from "@/app/dashboard/recommendations/actions";
import { requestRecommendationSchema } from "@/schemas/verification";
import { RECOMMENDATION_STATUS_LABELS, type RecommendationStatus } from "@/types/verification";
import { MessageSquareQuote } from "lucide-react";

export interface RecommendationView {
  id: string;
  authorName: string;
  authorTitle: string | null;
  skillName: string | null;
  content: string | null;
  status: RecommendationStatus;
  /** Link to send to the recommender; only meaningful while the request is open. */
  link: string | null;
  expiresAt: string;
}

const TONES = { REQUESTED: "neutral", SUBMITTED: "accent", APPROVED: "success", DECLINED: "danger" } as const;

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={link}
        aria-label="Lien à envoyer"
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

export function RecommendationsManager({
  items,
  skills,
}: {
  items: RecommendationView[];
  skills: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ authorName: "", authorEmail: "", talentSkillId: "" });
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [rowError, setRowError] = useState<string>();

  function close() {
    setOpen(false);
    setCreated(undefined);
    setError(undefined);
    setValues({ authorName: "", authorEmail: "", talentSkillId: "" });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = requestRecommendationSchema.safeParse(values);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message);
    setError(undefined);
    startTransition(async () => {
      const result = await requestRecommendationAction(values);
      if (result.error) setError(result.error);
      else setCreated(result.link);
    });
  }

  function act(fn: () => Promise<{ error?: string }>) {
    setRowError(undefined);
    startTransition(async () => setRowError((await fn()).error));
  }

  const requestButton = (
    <Button onClick={() => setOpen(true)}>
      <Plus /> Demander une recommandation
    </Button>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-muted">
          {items.length} demande{items.length > 1 ? "s" : ""}
        </p>
        {requestButton}
      </div>

      {rowError && (
        <p role="alert" className="text-danger mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {rowError}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Aucune recommandation pour l'instant"
          description="Demandez à un collègue ou un client d'attester votre travail. Il reçoit un lien, sans compte à créer."
          action={requestButton}
        />
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {r.authorName}
                      {r.authorTitle && <span className="text-muted font-normal"> · {r.authorTitle}</span>}
                    </p>
                    {r.skillName && <p className="text-muted text-sm">À propos de {r.skillName}</p>}
                  </div>
                  <Badge tone={TONES[r.status]}>{RECOMMENDATION_STATUS_LABELS[r.status]}</Badge>
                </div>

                {r.content && (
                  <blockquote className="border-border mt-3 border-l-2 pl-4 text-sm">{r.content}</blockquote>
                )}

                {r.status === "REQUESTED" && r.link && (
                  <div className="mt-3">
                    <p className="text-muted mb-1 text-xs">Envoyez ce lien à {r.authorName} :</p>
                    <CopyLink link={r.link} />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {r.status === "SUBMITTED" && (
                    <>
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => act(() => moderateRecommendationAction(r.id, "APPROVED"))}
                      >
                        <Check /> Publier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => act(() => moderateRecommendationAction(r.id, "DECLINED"))}
                      >
                        <X /> Refuser
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    aria-label={`Supprimer la demande de ${r.authorName}`}
                    onClick={() => act(() => deleteRecommendationAction(r.id))}
                  >
                    <Trash2 /> Supprimer
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={close} title="Demander une recommandation">
        {created ? (
          <div className="space-y-4">
            <p className="text-muted text-sm">
              Demande créée. Envoyez ce lien personnel à votre recommandeur : il est valable 30 jours et ne
              peut être utilisé qu&apos;une fois.
            </p>
            <CopyLink link={created} />
            <div className="flex justify-end">
              <Button onClick={close}>Terminer</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reco-name">Nom du recommandeur</Label>
              <Input
                id="reco-name"
                value={values.authorName}
                onChange={(e) => setValues((v) => ({ ...v, authorName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reco-email">E-mail (optionnel)</Label>
              <Input
                id="reco-email"
                type="email"
                value={values.authorEmail}
                onChange={(e) => setValues((v) => ({ ...v, authorEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reco-skill">Compétence concernée (optionnel)</Label>
              <select
                id="reco-skill"
                value={values.talentSkillId}
                onChange={(e) => setValues((v) => ({ ...v, talentSkillId: e.target.value }))}
                className="border-border bg-surface h-11 w-full rounded-xl border px-4 text-sm"
              >
                <option value="">Aucune en particulier</option>
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <p role="alert" className="text-danger text-sm">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={close}>
                Annuler
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Création…" : "Créer le lien"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
