import type { JobDisplayStatus, JobOfferRow } from "@/types/job-offer";

export const OFFERS_PER_PAGE = 9;

export const OFFER_TABS = [
  ["all", "Toutes"],
  ["PUBLISHED", "Publiées"],
  ["DRAFT", "Brouillons"],
  ["EXPIRED", "Expirées"],
] as const;
export type OfferTab = (typeof OFFER_TABS)[number][0];

export const parseOfferTab = (v: string | undefined): OfferTab =>
  OFFER_TABS.find(([key]) => key === v)?.[0] ?? "all";

export interface OfferFilters {
  tab?: string;
  q?: string;
  contract?: string;
  department?: string;
}

export function filterOffers(all: JobOfferRow[], f: OfferFilters) {
  const tab = parseOfferTab(f.tab);
  const q = f.q?.trim().toLowerCase();
  return all.filter(
    (o) =>
      (tab === "all" || o.displayStatus === tab) &&
      (!q || [o.title, o.location, ...o.skills].some((t) => t.toLowerCase().includes(q))) &&
      (!f.contract || o.contract === f.contract) &&
      (!f.department || o.departmentId === f.department),
  );
}

export function tabCounts(all: JobOfferRow[]): Record<OfferTab, number> {
  const count = (s: JobDisplayStatus) => all.filter((o) => o.displayStatus === s).length;
  return { all: all.length, PUBLISHED: count("PUBLISHED"), DRAFT: count("DRAFT"), EXPIRED: count("EXPIRED") };
}

const DAY_MS = 86_400_000;

export function offerStats(all: JobOfferRow[], now = new Date()) {
  const published = all.filter((o) => o.displayStatus === "PUBLISHED");
  const inWindow = (from: number, to: number) =>
    all.filter(
      (o) =>
        o.publishedAt &&
        Date.parse(o.publishedAt) > now.getTime() - to * DAY_MS &&
        Date.parse(o.publishedAt) <= now.getTime() - from * DAY_MS,
    ).length;
  const recent = inWindow(0, 30);
  const before = inWindow(30, 60);
  return {
    published: published.length,
    applicants: all.reduce((sum, o) => sum + o.applicants, 0),
    views: all.reduce((sum, o) => sum + o.views, 0),
    /** Offers published in the last 30 days against the 30 before; null when there is nothing to compare. */
    deltaPercent: before === 0 ? null : Math.round(((recent - before) / before) * 100),
  };
}

export const topOffers = (all: JobOfferRow[], limit = 5) =>
  [...all]
    .filter((o) => o.applicants > 0)
    .sort((a, b) => b.applicants - a.applicants || a.title.localeCompare(b.title, "fr"))
    .slice(0, limit);

export const recentOffers = (all: JobOfferRow[], limit = 3) =>
  [...all]
    .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt))
    .slice(0, limit);

/** A cell that starts like a formula would run in a spreadsheet: neutralize it. */
const cell = (value: string | number) => {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function offersCsv(
  all: JobOfferRow[],
  statusLabel: (s: JobDisplayStatus) => string,
  contractLabel: (c: string) => string,
) {
  const header = [
    "Offre d'emploi",
    "Localisation",
    "Type de contrat",
    "Candidatures",
    "Vues",
    "Statut",
    "Date de publication",
  ];
  const lines = all.map((o) => [
    o.title,
    o.location,
    contractLabel(o.contract),
    o.applicants,
    o.views,
    statusLabel(o.displayStatus),
    o.publishedAt ? o.publishedAt.slice(0, 10) : "",
  ]);
  // The BOM makes Excel read the accents as UTF-8.
  return `﻿${[header, ...lines].map((row) => row.map(cell).join(";")).join("\r\n")}\r\n`;
}
