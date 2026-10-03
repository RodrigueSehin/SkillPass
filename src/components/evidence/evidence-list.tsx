"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  EVIDENCE_STATUS_LABELS,
  EVIDENCE_TYPE_LABELS,
  type EvidenceDTO,
  type EvidenceStatus,
} from "@/types/evidence";

const STATUS_TONES = { VERIFIED: "success", PENDING: "accent", UNVERIFIED: "neutral" } as const;

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
    : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;

export function EvidenceStatusBadge({ status }: { status: EvidenceStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{EVIDENCE_STATUS_LABELS[status]}</Badge>;
}

interface EvidenceListProps {
  items: EvidenceDTO[];
  /** Hide the skill name when the list is already scoped to one skill. */
  showSkill?: boolean;
}

export function EvidenceList({ items, showSkill = true }: EvidenceListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<EvidenceDTO | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const res = await fetch(`/api/evidence/${target.id}`, { method: "DELETE" }).catch(() => null);
      setError(res?.ok ? undefined : "La suppression a échoué. Veuillez réessayer.");
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <>
      {error && (
        <p role="alert" className="text-danger mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <ul className="grid gap-4 lg:grid-cols-2">
        {items.map((e) => (
          <li key={e.id}>
            <Card className="h-full p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{e.title}</h3>
                  <p className="text-muted text-sm">
                    {EVIDENCE_TYPE_LABELS[e.type]}
                    {showSkill && ` · ${e.skillName}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Supprimer ${e.title}`}
                  onClick={() => setDeleting(e)}
                >
                  <Trash2 />
                </Button>
              </div>
              {e.description && <p className="text-muted mt-2 text-sm">{e.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <EvidenceStatusBadge status={e.status} />
                {e.hasFile && (
                  <a
                    href={`/api/evidence/${e.id}/file`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    <FileText className="size-3.5" aria-hidden /> {e.fileName}
                    {e.sizeBytes ? ` (${formatSize(e.sizeBytes)})` : ""}
                  </a>
                )}
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    Ouvrir le lien <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer cette preuve ?">
        <p className="text-muted text-sm">
          « {deleting?.title} » et son fichier éventuel seront définitivement supprimés.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Annuler
          </Button>
          <Button className="bg-danger hover:bg-red-700" onClick={confirmDelete} disabled={pending}>
            {pending ? "Suppression…" : "Supprimer"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
