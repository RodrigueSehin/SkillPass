import { stripFormatting } from "@/lib/rich-text";
import type { OpportunityInput } from "@/repositories/opportunity.repository";
import { JOB_CONTRACT_LABELS, type JobDisplayStatus, type JobOfferDTO } from "@/types/job-offer";
import type { OrganizationDTO } from "@/types/business";

const KIND: Record<JobOfferDTO["contract"], string> = {
  CDI: "EMPLOI",
  CDD: "EMPLOI",
  STAGE: "STAGE",
  FREELANCE: "FREELANCE",
  ALTERNANCE: "ALTERNANCE",
  PROJET: "PROJET",
};

const REGIONS: [string, RegExp][] = [
  ["CI", /c[ôo]te d'ivoire|abidjan|yamoussoukro|bouak[ée]|san[- ]?pedro|cocody|ivoire/i],
  [
    "EUROPE",
    /france|paris|europe|belgique|bruxelles|allemagne|espagne|italie|royaume-uni|londres|suisse|irlande/i,
  ],
  ["NORTH_AMERICA", /[ée]tats-unis|usa|canada|montr[ée]al|new york|seattle|am[ée]rique du nord/i],
];

/** The place filter of the talent job board: remote offers first, then a guess from the address. */
export function regionOf(offer: Pick<JobOfferDTO, "location" | "workMode">) {
  if (offer.workMode === "REMOTE") return "REMOTE";
  return REGIONS.find(([, re]) => re.test(offer.location))?.[0] ?? "AFRICA";
}

const DOMAIN_HINTS: [string, RegExp][] = [
  ["Data & IA", /\b(data|donn[ée]es|power bi|sql|python|dax|analytics|ia|intelligence)\b/i],
  [
    "Cloud & Infrastructure",
    /\b(azure|aws|cloud|r[ée]seau|infrastructure|devops|syst[èe]me|sharepoint|support it)\b/i,
  ],
  [
    "Gestion & Business",
    /\b(gestion de projet|agile|scrum|commercial|vente|rh|ressources humaines|finance|marketing|leadership|management)\b/i,
  ],
];

/** The domain filter of the job board, guessed from the title and the skills. */
export function domainOf(offer: Pick<JobOfferDTO, "title" | "skills">) {
  const text = [offer.title, ...offer.skills].join(" ");
  return DOMAIN_HINTS.find(([, re]) => re.test(text))?.[0] ?? "Tech & Digital";
}

export function levelOf(experience: string) {
  if (/moins d'1 an/i.test(experience)) return "BEGINNER";
  if (/^1 à 3|^3 à 5/.test(experience)) return "INTERMEDIATE";
  return "SENIOR";
}

const MONEY = new Intl.NumberFormat("fr-FR");
const money = (n: number) => MONEY.format(n).replace(/[  ]/g, " ");

/** "800 000 – 1 200 000 FCFA", "À partir de 800 000 FCFA", or null when no salary was given. */
export function salaryLabel(offer: Pick<JobOfferDTO, "salaryMin" | "salaryMax" | "currency">) {
  const { salaryMin: min, salaryMax: max, currency } = offer;
  if (min != null && max != null) return `${money(min)} – ${money(max)} ${currency}`;
  if (min != null) return `À partir de ${money(min)} ${currency}`;
  if (max != null) return `Jusqu'à ${money(max)} ${currency}`;
  return null;
}

/** Bullet lines of the description become the "missions"; the rest stays as the text. */
export function splitDescription(markdown: string) {
  const missions: string[] = [];
  const text: string[] = [];
  for (const line of markdown.split("\n")) {
    const bullet = /^\s*(?:[-*•]|\d+\.)\s+(.*\S)\s*$/.exec(line);
    if (bullet) missions.push(stripFormatting(bullet[1]));
    else text.push(stripFormatting(line));
  }
  return {
    missions,
    description: text
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  };
}

const PROCESS: Record<JobOfferDTO["applicationMode"], string[]> = {
  SIMPLE: [
    "Candidature en ligne (CV et lettre de motivation)",
    "Étude du dossier",
    "Entretien",
    "Proposition et intégration",
  ],
  ADVANCED: [
    "Formulaire de candidature détaillé",
    "Étude du dossier",
    "Entretien",
    "Proposition et intégration",
  ],
  ASSESSMENT: ["Candidature en ligne", "Test de compétences", "Entretien", "Proposition et intégration"],
};

/** Everything the talent-side page shows for an offer published by an organization. */
export function toOpportunityInput(
  offer: JobOfferDTO,
  org: OrganizationDTO,
  now = new Date(),
): OpportunityInput {
  const { missions, description } = splitDescription(offer.description);
  const languages = [...offer.languages, ...(offer.otherLanguage ? [offer.otherLanguage] : [])];
  const requirements = [
    offer.education ? `Niveau d'études : ${offer.education}` : null,
    languages.length ? `Langues : ${languages.join(", ")}` : null,
    offer.certifications.length ? `Certifications souhaitées : ${offer.certifications.join(", ")}` : null,
    offer.permit && offer.permit !== "Aucun" ? `Permis requis : ${offer.permit}` : null,
    offer.softSkills.length ? `Qualités : ${offer.softSkills.join(", ")}` : null,
  ].filter((r): r is string => Boolean(r));

  return {
    title: offer.title,
    company: org.name,
    companyLabel: null,
    kind: KIND[offer.contract],
    region: regionOf(offer),
    location: offer.location,
    workMode: offer.workMode,
    commitment: JOB_CONTRACT_LABELS[offer.contract],
    domain: domainOf(offer),
    level: levelOf(offer.experience),
    skills: offer.skills,
    description,
    applyUrl: null,
    publishedAt: offer.publishedAt ?? now.toISOString(),
    deadline: offer.deadline ? new Date(`${offer.deadline}T23:59:59.000Z`).toISOString() : null,
    workModeDetail: offer.workMode
      ? { ONSITE: "Sur site", HYBRID: "Hybride", REMOTE: "Télétravail complet" }[offer.workMode]
      : null,
    experienceRange: offer.experience,
    salary: salaryLabel(offer) ?? "À discuter",
    missions,
    requirements,
    perks: [],
    process: PROCESS[offer.applicationMode],
    optionalSkills: [],
    companyLegalName: org.name,
    companySector: org.industry,
    companySize: org.size,
    companyAbout: org.description,
    companyTagline: null,
    companyVerified: org.verified,
    companyWebsite: org.website,
  };
}

/** A published offer past its deadline reads as expired in the list. */
export function displayStatus(
  offer: Pick<JobOfferDTO, "status" | "deadline">,
  today: string,
): JobDisplayStatus {
  if (offer.status === "PUBLISHED" && offer.deadline && offer.deadline < today) return "EXPIRED";
  return offer.status;
}

/** Whether the offer is on the talent job board right now. */
export const isOnBoard = (
  offer: Pick<JobOfferDTO, "status" | "deadline" | "visibility" | "channels">,
  today: string,
) =>
  displayStatus(offer, today) === "PUBLISHED" &&
  offer.visibility === "PUBLIC" &&
  offer.channels.includes("PLATFORM");
