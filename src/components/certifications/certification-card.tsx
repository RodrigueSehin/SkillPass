import { CalendarCheck2, CalendarX2, ExternalLink, Hash } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { certificationState, daysUntilExpiry, type CertificationState } from "@/lib/certification-status";
import { formatDay } from "@/lib/utils/format";
import type { CertificationDTO } from "@/types/portfolio";
import type { ItemView } from "@/components/resources/resource-manager";
import { VERIFICATION_STATUS_LABELS } from "@/types/skill";
import { CertificationCardActions } from "./certification-editor";

const STATE: Record<CertificationState, { label: string; tone: string }> = {
  ACTIVE: { label: "Obtenue", tone: "bg-green-50 text-success" },
  EXPIRING: { label: "Expire bientôt", tone: "bg-amber-50 text-amber-700" },
  EXPIRED: { label: "Expirée", tone: "bg-red-50 text-danger" },
};

const VERIFICATION_TONE = {
  VERIFIED: "bg-blue-50 text-brand",
  PENDING: "bg-amber-50 text-amber-700",
  UNVERIFIED: "bg-slate-100 text-slate-600",
  EXPIRED: "bg-slate-100 text-slate-600",
} as const;

const TILES = [
  "bg-blue-100 text-blue-700",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
];

/** Same colour for the same publisher, whatever the order of the list. */
const tileFor = (issuer: string) =>
  TILES[[...issuer].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TILES.length];

export function CertificationCard({
  cert,
  item,
  today,
}: {
  cert: CertificationDTO;
  item: ItemView;
  today: string;
}) {
  const state = certificationState(cert, today);
  const left = daysUntilExpiry(cert, today);
  const status = STATE[state];

  return (
    <article className="border-border/60 shadow-soft hover:shadow-lift flex h-full flex-col rounded-2xl border bg-white p-4 transition-shadow">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold",
            tileFor(cert.issuer),
          )}
        >
          {cert.issuer.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-navy text-sm leading-snug font-bold">{cert.name}</h2>
          <p className="text-muted mt-0.5 truncate text-xs">{cert.issuer}</p>
        </div>
        <CertificationCardActions item={item} />
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <span className={cn("rounded-full px-2.5 py-0.5", status.tone)}>{status.label}</span>
        <span className={cn("rounded-full px-2.5 py-0.5", VERIFICATION_TONE[cert.verificationStatus])}>
          {VERIFICATION_STATUS_LABELS[cert.verificationStatus]}
        </span>
      </p>

      <ul className="text-muted mt-3 space-y-1.5 text-xs">
        <li className="flex items-center gap-2">
          <CalendarCheck2 className="size-3.5 shrink-0" aria-hidden /> Obtenue le {formatDay(cert.issueDate)}
        </li>
        {cert.expirationDate && (
          <li
            className={cn(
              "flex items-center gap-2",
              state === "EXPIRED" && "text-danger",
              state === "EXPIRING" && "text-amber-700",
            )}
          >
            <CalendarX2 className="size-3.5 shrink-0" aria-hidden />
            {state === "EXPIRED"
              ? `Expirée le ${formatDay(cert.expirationDate)}`
              : `Expire le ${formatDay(cert.expirationDate)}${left !== null && left <= 90 ? ` (${left} jour${left > 1 ? "s" : ""})` : ""}`}
          </li>
        )}
        {cert.credentialId && (
          <li className="flex items-center gap-2">
            <Hash className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">Credential ID : {cert.credentialId}</span>
          </li>
        )}
      </ul>

      {cert.credentialUrl && (
        <a
          href={cert.credentialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand mt-4 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-50 text-xs font-semibold hover:bg-blue-100"
        >
          Voir le certificat <ExternalLink className="size-3.5" aria-hidden />
        </a>
      )}
    </article>
  );
}
