import type { JobOfferDTO } from "@/types/job-offer";
import type { TalentRecord } from "@/types/talent";

/** A talent is proposed for an offer from this score up, and only if one required skill matches. */
export const PROPOSAL_THRESHOLD = 50;
export const MATCHES_PER_PAGE = 6;

export interface OfferMatch {
  record: TalentRecord;
  /** 0-100. */
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedCertifications: string[];
  /** Short reasons shown on the card, most important first. */
  reasons: string[];
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Years asked by the offer's experience bracket ("3 à 5 ans" asks for 3). */
export function requiredYears(experience: string): number {
  const digits = /(\d+)/.exec(experience);
  if (!digits || /moins/i.test(experience)) return 0;
  return Number(digits[1]);
}

/** The talent's own words for where they work, compared to the offer's. Remote offers fit everyone. */
function locationFit(offer: JobOfferDTO, talent: TalentRecord): number {
  if (offer.workMode === "REMOTE") return 1;
  if (!talent.location) return 0.5;
  const city = (s: string) => norm(s.split(",")[0] ?? "");
  return city(offer.location) !== "" && city(offer.location) === city(talent.location) ? 1 : 0;
}

const AVAILABILITY_FIT: Record<TalentRecord["availability"], number> = {
  IMMEDIATE: 1,
  ONE_MONTH: 0.75,
  THREE_MONTHS: 0.4,
  NOT_AVAILABLE: 0,
};

/**
 * Weights: required skills 60, verified share of those skills 10, certifications 10, experience 10,
 * place 5, availability 5. Nothing is inferred: every point comes from a field of the offer and one of the
 * talent's public profile.
 */
export function scoreOffer(offer: JobOfferDTO, talent: TalentRecord): OfferMatch | null {
  if (offer.skills.length === 0) return null;

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  let verified = 0;
  for (const wanted of offer.skills) {
    const owned = talent.skills.find((s) => norm(s.name) === norm(wanted));
    if (!owned) {
      missingSkills.push(wanted);
      continue;
    }
    matchedSkills.push(wanted);
    if (owned.verified) verified += 1;
  }

  const matchedCertifications = offer.certifications.filter((c) =>
    talent.certifications.some((x) => !x.expired && norm(x.name).includes(norm(c))),
  );

  const skillShare = matchedSkills.length / offer.skills.length;
  const verifiedShare = matchedSkills.length ? verified / offer.skills.length : 0;
  const certShare = offer.certifications.length
    ? matchedCertifications.length / offer.certifications.length
    : 1;
  const years = requiredYears(offer.experience);
  const experienceShare = years === 0 ? 1 : Math.min(1, talent.yearsOfExperience / years);

  const score = Math.round(
    60 * skillShare +
      10 * verifiedShare +
      10 * certShare +
      10 * experienceShare +
      5 * locationFit(offer, talent) +
      5 * AVAILABILITY_FIT[talent.availability],
  );

  const reasons: string[] = [];
  if (matchedSkills.length > 0)
    reasons.push(`${matchedSkills.length}/${offer.skills.length} compétences requises`);
  if (verified > 0) reasons.push(`${verified} vérifiée${verified > 1 ? "s" : ""}`);
  if (matchedCertifications.length > 0)
    reasons.push(
      `${matchedCertifications.length} certification${matchedCertifications.length > 1 ? "s" : ""}`,
    );
  if (years > 0 && talent.yearsOfExperience >= years)
    reasons.push(`${talent.yearsOfExperience} ans d'expérience`);
  if (talent.availability === "IMMEDIATE") reasons.push("disponible maintenant");

  return { record: talent, score, matchedSkills, missingSkills, matchedCertifications, reasons };
}

/** Every talent that clears the threshold, best first (ties: more verified skills, then name). */
export function matchTalents(offer: JobOfferDTO, records: TalentRecord[]): OfferMatch[] {
  return records
    .flatMap((t) => {
      const m = scoreOffer(offer, t);
      return m && m.matchedSkills.length > 0 && m.score >= PROPOSAL_THRESHOLD ? [m] : [];
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.record.skills.filter((s) => s.verified).length - a.record.skills.filter((s) => s.verified).length ||
        a.record.fullName.localeCompare(b.record.fullName, "fr"),
    );
}

/** Offers that can still receive candidates: only these are matched. */
export const isMatchable = (o: { displayStatus: string }) =>
  o.displayStatus === "PUBLISHED" || o.displayStatus === "DRAFT";

/** Distinct talents proposed across the given offers, for the "Talents proposés" figure. */
export function proposedTalentCount(offers: JobOfferDTO[], records: TalentRecord[]): number {
  const ids = new Set<string>();
  for (const offer of offers) for (const m of matchTalents(offer, records)) ids.add(m.record.id);
  return ids.size;
}
