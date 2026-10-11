import {
  Award,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  ImageIcon,
  Paperclip,
  PencilLine,
  PlayCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DISPLAY_STATUS_LABELS,
  displayStatus,
  fileUrl,
  type EvidenceDisplayStatus,
} from "@/lib/evidence-view";
import { cn } from "@/lib/utils/cn";
import { EVIDENCE_TYPE_LABELS, type EvidenceDTO, type EvidenceType } from "@/types/evidence";

export const TYPE_ICONS: Record<EvidenceType, LucideIcon> = {
  PROJECT: FolderKanban,
  CERTIFICATION: Award,
  DEMO: PlayCircle,
  SCREENSHOT: ImageIcon,
  DOCUMENT: FileText,
  OTHER: Paperclip,
  LINK: Paperclip,
  REPOSITORY: Paperclip,
  PORTFOLIO: Paperclip,
  EXPERIENCE: Paperclip,
  ASSESSMENT: Award,
  RECOMMENDATION: Paperclip,
};

const TYPE_TONES: Record<EvidenceType, string> = {
  PROJECT: "bg-blue-50 text-brand",
  CERTIFICATION: "bg-orange-50 text-orange-600",
  DEMO: "bg-violet-50 text-violet-600",
  SCREENSHOT: "bg-fuchsia-50 text-fuchsia-600",
  DOCUMENT: "bg-sky-50 text-sky-700",
  OTHER: "bg-slate-100 text-slate-600",
  LINK: "bg-slate-100 text-slate-600",
  REPOSITORY: "bg-slate-100 text-slate-600",
  PORTFOLIO: "bg-slate-100 text-slate-600",
  EXPERIENCE: "bg-slate-100 text-slate-600",
  ASSESSMENT: "bg-emerald-50 text-emerald-700",
  RECOMMENDATION: "bg-rose-50 text-rose-600",
};

export const TYPE_GRADIENTS: Record<EvidenceType, string> = {
  PROJECT: "from-blue-500 to-indigo-700",
  CERTIFICATION: "from-orange-400 to-amber-600",
  DEMO: "from-violet-500 to-purple-700",
  SCREENSHOT: "from-fuchsia-500 to-pink-700",
  DOCUMENT: "from-sky-500 to-cyan-700",
  OTHER: "from-slate-400 to-slate-600",
  LINK: "from-slate-400 to-slate-600",
  REPOSITORY: "from-slate-400 to-slate-600",
  PORTFOLIO: "from-slate-400 to-slate-600",
  EXPERIENCE: "from-slate-400 to-slate-600",
  ASSESSMENT: "from-emerald-500 to-teal-700",
  RECOMMENDATION: "from-rose-400 to-red-600",
};

export function TypeBadge({ type, className }: { type: EvidenceType; className?: string }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
        TYPE_TONES[type],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden /> {EVIDENCE_TYPE_LABELS[type]}
    </span>
  );
}

const STATUS_STYLE: Record<EvidenceDisplayStatus, { tone: string; icon: LucideIcon }> = {
  PUBLISHED: { tone: "bg-green-50 text-success", icon: CheckCircle2 },
  VERIFIED: { tone: "bg-green-50 text-success", icon: CheckCircle2 },
  PENDING: { tone: "bg-amber-50 text-amber-700", icon: Clock },
  DRAFT: { tone: "bg-slate-100 text-slate-600", icon: PencilLine },
};

export function StatusBadge({
  evidence,
  className,
}: {
  evidence: Pick<EvidenceDTO, "published" | "status">;
  className?: string;
}) {
  const status = displayStatus(evidence);
  const { tone, icon: Icon } = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        tone,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden /> {DISPLAY_STATUS_LABELS[status]}
    </span>
  );
}

/** First image of the evidence, or a gradient with the type icon. */
export function EvidenceCover({ evidence, className }: { evidence: EvidenceDTO; className?: string }) {
  const image = evidence.files.find((f) => f.isImage);
  const Icon = TYPE_ICONS[evidence.type];
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", TYPE_GRADIENTS[evidence.type], className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- private, authenticated file served by our API
        <img src={fileUrl(evidence.id, image.id)} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/90">
          <Icon className="size-12" aria-hidden />
        </div>
      )}
    </div>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-brand rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}
