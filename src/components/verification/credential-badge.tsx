import Link from "next/link";
import { BadgeCheck, ExternalLink, ShieldAlert, TimerOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatMonth } from "@/lib/utils/format";
import { SKILL_LEVEL_LABELS } from "@/types/skill";
import {
  CREDENTIAL_STATUS_LABELS,
  effectiveCredentialStatus,
  type CredentialDTO,
  type CredentialEffectiveStatus,
} from "@/types/verification";

const LEVEL_STYLES = {
  BEGINNER: "from-slate-600 to-slate-800",
  INTERMEDIATE: "from-blue-600 to-blue-800",
  ADVANCED: "from-navy to-blue-700",
  EXPERT: "from-amber-500 to-navy",
} as const;

const STATUS_ICON: Record<CredentialEffectiveStatus, typeof BadgeCheck> = {
  VALID: BadgeCheck,
  REVOKED: ShieldAlert,
  EXPIRED: TimerOff,
};

interface CredentialBadgeProps {
  credential: Pick<
    CredentialDTO,
    "credentialId" | "skillName" | "level" | "issuer" | "issuedAt" | "expiresAt" | "status"
  >;
  /** Absolute verification URL encoded in the QR code. */
  verifyUrl: string;
  showQr?: boolean;
}

/** The badge: a verifiable credential rendered as a card. Server component, no JS needed. */
export function CredentialBadge({ credential, verifyUrl, showQr = true }: CredentialBadgeProps) {
  const status = effectiveCredentialStatus(credential);
  const Icon = STATUS_ICON[status];
  const muted = status !== "VALID";

  return (
    <article
      aria-label={`Badge ${credential.skillName} ${SKILL_LEVEL_LABELS[credential.level]}`}
      className={`shadow-soft overflow-hidden rounded-2xl bg-gradient-to-br text-white ${LEVEL_STYLES[credential.level]} ${muted ? "opacity-70 grayscale" : ""}`}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-blue-100 uppercase">{credential.issuer}</p>
          <h3 className="mt-1 text-lg leading-tight font-bold">{credential.skillName}</h3>
          <p className="text-sm text-amber-300">{SKILL_LEVEL_LABELS[credential.level]}</p>
        </div>
        {showQr && (
          <div className="shrink-0 rounded-lg bg-white p-1.5">
            <QRCodeSVG
              value={verifyUrl}
              size={64}
              fgColor="#011E50"
              level="M"
              title={`QR code vers ${verifyUrl}`}
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-black/20 px-5 py-3 text-xs">
        <span className="inline-flex items-center gap-1 font-semibold">
          <Icon className="size-4" aria-hidden /> {CREDENTIAL_STATUS_LABELS[status]}
        </span>
        <span className="font-mono">{credential.credentialId}</span>
        <span>Émis en {formatMonth(credential.issuedAt.slice(0, 10))}</span>
        <Link
          href={`/verify/${credential.credentialId}`}
          className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
        >
          Vérifier <ExternalLink className="size-3" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
