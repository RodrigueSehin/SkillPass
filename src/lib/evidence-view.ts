import type { EvidenceDTO, EvidenceType } from "@/types/evidence";

/** Tabs of the evidence page. Legacy and platform-generated types are grouped under "Autres". */
export const EVIDENCE_TABS = [
  { key: "PROJECT", label: "Projets", types: ["PROJECT"] },
  { key: "CERTIFICATION", label: "Certifications", types: ["CERTIFICATION"] },
  { key: "DEMO", label: "Démos", types: ["DEMO"] },
  { key: "DOCUMENT", label: "Documents", types: ["DOCUMENT"] },
  { key: "SCREENSHOT", label: "Captures", types: ["SCREENSHOT"] },
  {
    key: "OTHER",
    label: "Autres",
    types: ["OTHER", "LINK", "REPOSITORY", "PORTFOLIO", "EXPERIENCE", "ASSESSMENT", "RECOMMENDATION"],
  },
] as const satisfies readonly { key: string; label: string; types: readonly EvidenceType[] }[];

export type EvidenceTabKey = (typeof EVIDENCE_TABS)[number]["key"];

export const tabOf = (type: EvidenceType): EvidenceTabKey =>
  EVIDENCE_TABS.find((t) => (t.types as readonly string[]).includes(type))!.key;

export type EvidenceDisplayStatus = "DRAFT" | "PENDING" | "VERIFIED" | "PUBLISHED";

export const DISPLAY_STATUS_LABELS: Record<EvidenceDisplayStatus, string> = {
  DRAFT: "Brouillon",
  PENDING: "En validation",
  VERIFIED: "Vérifiée",
  PUBLISHED: "Publiée",
};

export function displayStatus(e: Pick<EvidenceDTO, "published" | "status">): EvidenceDisplayStatus {
  if (!e.published) return "DRAFT";
  if (e.status === "PENDING") return "PENDING";
  if (e.status === "VERIFIED") return "VERIFIED";
  return "PUBLISHED";
}

export interface EvidenceFilters {
  q?: string;
  tab?: string;
  skill?: string;
  type?: string;
  status?: string;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Everything except the tab, so tab counts can reflect the other active filters. */
export function filterEvidence(items: EvidenceDTO[], f: EvidenceFilters) {
  const q = f.q ? norm(f.q.trim()) : "";
  return items.filter((e) => {
    if (f.skill && !e.skills.some((s) => s.id === f.skill)) return false;
    if (f.type && e.type !== f.type) return false;
    if (f.status && displayStatus(e) !== f.status) return false;
    if (q) {
      const haystack = norm(
        [e.title, e.description, e.organization, ...e.technologies, ...e.tags, ...e.skills.map((s) => s.name)]
          .filter(Boolean)
          .join(" "),
      );
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** "2024-01" → "Jan. 2024". */
export function formatMonth(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}-01T00:00:00Z`);
  const text = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatPeriod(e: Pick<EvidenceDTO, "startDate" | "endDate">) {
  const start = formatMonth(e.startDate);
  const end = formatMonth(e.endDate);
  if (start && end) return `${start} – ${end}`;
  if (start) return `Depuis ${start}`;
  return end;
}

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;

export const fileUrl = (evidenceId: string, fileId: string) => `/api/evidence/${evidenceId}/files/${fileId}`;
