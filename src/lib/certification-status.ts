import type { CertificationDTO } from "@/types/portfolio";

/** A certification is flagged "expiring" when it lapses within this many days. */
export const EXPIRING_SOON_DAYS = 90;

export type CertificationState = "ACTIVE" | "EXPIRING" | "EXPIRED";

const DAY_MS = 86_400_000;
const dayNumber = (day: string) => Math.floor(Date.parse(`${day}T00:00:00Z`) / DAY_MS);

/** Days until expiry (negative once lapsed), or null when the certification never expires. */
export function daysUntilExpiry(c: Pick<CertificationDTO, "expirationDate">, today: string) {
  return c.expirationDate ? dayNumber(c.expirationDate) - dayNumber(today) : null;
}

/** Derived from dates, so a lapse is flagged without a background job. */
export function certificationState(
  c: Pick<CertificationDTO, "expirationDate">,
  today: string,
): CertificationState {
  const left = daysUntilExpiry(c, today);
  if (left === null) return "ACTIVE";
  if (left < 0) return "EXPIRED";
  return left <= EXPIRING_SOON_DAYS ? "EXPIRING" : "ACTIVE";
}

export const CERT_TABS = ["all", "obtained", "expiring", "expired"] as const;
export type CertTab = (typeof CERT_TABS)[number];

export const CERT_TAB_LABELS: Record<CertTab, string> = {
  all: "Toutes",
  obtained: "Obtenues",
  expiring: "Expirant bientôt",
  expired: "Expirées",
};

export const CERT_SORTS = [
  ["recent", "Plus récentes"],
  ["name", "Nom"],
  ["expiry", "Expiration proche"],
] as const;
export type CertSort = (typeof CERT_SORTS)[number][0];

export const VERIFICATION_FILTERS = [
  ["VERIFIED", "Vérifiée"],
  ["PENDING", "En attente"],
  ["UNVERIFIED", "Non vérifiée"],
] as const;

export interface CertificationFilter {
  tab?: string;
  q?: string;
  issuer?: string;
  verification?: string;
  sort?: string;
}

export const parseCertTab = (v: string | undefined): CertTab => CERT_TABS.find((t) => t === v) ?? "all";
export const parseCertSort = (v: string | undefined): CertSort =>
  CERT_SORTS.find(([s]) => s === v)?.[0] ?? "recent";

export function filterCertifications(items: CertificationDTO[], filter: CertificationFilter, today: string) {
  const tab = parseCertTab(filter.tab);
  const q = filter.q?.trim().toLowerCase();
  const verification = VERIFICATION_FILTERS.find(([v]) => v === filter.verification)?.[0];
  const sort = parseCertSort(filter.sort);

  const kept = items.filter((c) => {
    const state = certificationState(c, today);
    if (q && !`${c.name} ${c.issuer}`.toLowerCase().includes(q)) return false;
    if (filter.issuer && c.issuer !== filter.issuer) return false;
    if (verification && c.verificationStatus !== verification) return false;
    if (tab === "obtained") return state !== "EXPIRED";
    if (tab === "expiring") return state === "EXPIRING";
    if (tab === "expired") return state === "EXPIRED";
    return true;
  });

  return [...kept].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "fr");
    if (sort === "expiry") {
      // Certifications that never expire go last.
      return (a.expirationDate ?? "9999-12-31").localeCompare(b.expirationDate ?? "9999-12-31");
    }
    return b.issueDate.localeCompare(a.issueDate);
  });
}

export interface CertificationStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  /** Certifications issued during the current calendar year. */
  issuedThisYear: number;
}

export function certificationStats(items: CertificationDTO[], today: string): CertificationStats {
  const states = items.map((c) => certificationState(c, today));
  return {
    total: items.length,
    active: states.filter((s) => s === "ACTIVE").length,
    expiring: states.filter((s) => s === "EXPIRING").length,
    expired: states.filter((s) => s === "EXPIRED").length,
    issuedThisYear: items.filter((c) => c.issueDate.slice(0, 4) === today.slice(0, 4)).length,
  };
}
