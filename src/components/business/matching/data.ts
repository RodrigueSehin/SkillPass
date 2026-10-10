import { cache } from "react";
import { getTalentDirectoryRepository } from "@/repositories";
import { getJobOfferService, getMatchingService } from "@/services/container";

export const DIRECTORY_LIMIT = 500;

/** Loaded once per request, whichever tab or panel asks first. */
export const loadDirectory = cache(() => getTalentDirectoryRepository().listPublic(DIRECTORY_LIMIT));
export const loadOffers = cache((orgId: string) => getJobOfferService().list(orgId));
export const loadSaved = cache((orgId: string) => getMatchingService().listSaved(orgId));

export type Raw = Record<string, string | string[] | undefined>;
export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** A link to the same page with some query parameters changed (null removes one). */
export function hrefWith(raw: Raw, changes: Record<string, string | null>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (changes[key] !== undefined) continue;
    for (const v of Array.isArray(value) ? value : value ? [value] : []) next.append(key, v);
  }
  for (const [key, value] of Object.entries(changes)) if (value) next.set(key, value);
  const qs = next.toString();
  return qs ? `/business/matching?${qs}` : "/business/matching";
}
