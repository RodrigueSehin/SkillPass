"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ExternalLink, FileText, XCircle } from "lucide-react";
import { rejectEvidenceAction, verifyEvidenceAction } from "@/app/admin/actions";
import { Chip, TypeBadge } from "@/components/evidence/evidence-bits";
import { formatPeriod, formatSize } from "@/lib/evidence-view";
import type { EvidenceReviewItem } from "@/services/evidence-review.service";

const button =
  "flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50";

/** One evidence waiting for the team's decision: what the talent claims, the files, and the two outcomes. */
export function EvidenceReviewCard({ item, requestedAt }: { item: EvidenceReviewItem; requestedAt: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const period = formatPeriod(item);
  const fileHref = (fileId: string) => `/api/admin/evidence/${item.id}/files/${fileId}`;

  function run(action: () => Promise<{ error?: string }>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <article className="border-border/60 shadow-soft space-y-4 rounded-2xl border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <TypeBadge type={item.type} />
          <h2 className="text-navy mt-2 text-lg font-bold">{item.title}</h2>
          <p className="text-muted text-sm">
            {item.talentName}
            {item.talentUsername && (
              <>
                {" · "}
                <a
                  href={`/${item.talentUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  profil public
                </a>
              </>
            )}
            {" · demandée le "}
            {requestedAt}
          </p>
        </div>
        <ul aria-label="Compétences" className="flex flex-wrap gap-1.5">
          {item.skills.map((s) => (
            <li key={s.id}>
              <Chip className="bg-blue-100/60">{s.name}</Chip>
            </li>
          ))}
        </ul>
      </div>

      {item.description && <p className="text-navy text-sm whitespace-pre-line">{item.description}</p>}

      <dl className="text-sm">
        {(
          [
            ["Rôle", item.role],
            ["Organisation", item.organization],
            ["Période", period],
          ] as const
        )
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-2 py-0.5">
              <dt className="text-muted">{k}</dt>
              <dd className="text-navy">{v}</dd>
            </div>
          ))}
        {item.url && (
          <div className="grid grid-cols-[110px_1fr] gap-2 py-0.5">
            <dt className="text-muted">Lien</dt>
            <dd>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand inline-flex items-center gap-1 break-all hover:underline"
              >
                {item.url} <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </a>
            </dd>
          </div>
        )}
      </dl>

      {item.technologies.length > 0 && (
        <ul aria-label="Technologies" className="flex flex-wrap gap-1.5">
          {item.technologies.map((t) => (
            <li key={t}>
              <Chip>{t}</Chip>
            </li>
          ))}
        </ul>
      )}

      {item.files.length > 0 && (
        <ul aria-label="Fichiers" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {item.files.map((f) => (
            <li key={f.id}>
              <a
                href={fileHref(f.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border flex items-center gap-3 rounded-xl border p-2 hover:bg-blue-50/60"
              >
                {f.isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private file served by an admin-only route
                  <img
                    src={fileHref(f.id)}
                    alt=""
                    loading="lazy"
                    className="h-12 w-16 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500">
                    <FileText className="size-5" aria-hidden />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="text-navy block truncate text-xs font-medium">{f.name}</span>
                  <span className="text-muted text-[11px]">{formatSize(f.sizeBytes)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {rejecting && (
        <div className="space-y-2">
          <label htmlFor={`note-${item.id}`} className="text-navy block text-sm font-semibold">
            Raison du refus <span className="text-muted font-normal">(le talent la lira)</span>
          </label>
          <textarea
            id={`note-${item.id}`}
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="border-border focus-visible:ring-brand/40 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2"
          />
        </div>
      )}
      {error && (
        <p role="alert" className="text-danger rounded-lg bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {rejecting ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => rejectEvidenceAction(item.id, note))}
              className={`${button} bg-danger text-white hover:bg-red-700`}
            >
              <XCircle className="size-4" aria-hidden /> Confirmer le refus
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setRejecting(false)}
              className={`${button} border-border text-navy border bg-white`}
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => verifyEvidenceAction(item.id))}
              className={`${button} bg-success text-white hover:opacity-90`}
            >
              <BadgeCheck className="size-4" aria-hidden /> Valider la preuve
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setRejecting(true)}
              className={`${button} border-danger text-danger border bg-white hover:bg-red-50`}
            >
              <XCircle className="size-4" aria-hidden /> Refuser
            </button>
          </>
        )}
      </div>
    </article>
  );
}
