import { randomUUID } from "node:crypto";
import { toOpportunityInput } from "@/lib/business/job-offer-mapping";
import type { JobOfferDTO, JobOfferInput } from "@/types/job-offer";
import type { InMemoryOpportunityRepository } from "./opportunity.memory";
import type { OrganizationRepository } from "./organization.repository";
import type { JobOfferRepository, JobPublication } from "./job-offer.repository";

const DAY_MS = 86_400_000;
const dayOf = (d: Date) => d.toISOString().slice(0, 10);

type StoredOffer = JobOfferDTO & { orgId: string };

const BASE: JobOfferInput = {
  title: "",
  description: "",
  contract: "CDI",
  location: "Abidjan, Côte d'Ivoire",
  workMode: "HYBRID",
  departmentId: null,
  experience: "3 à 5 ans",
  positions: 1,
  deadline: null,
  salaryMin: null,
  salaryMax: null,
  currency: "FCFA",
  skills: [],
  softSkills: [],
  certifications: [],
  education: "Licence / Bac+3",
  languages: ["Français", "Anglais"],
  otherLanguage: null,
  permit: null,
  mobility: "NONE",
  availability: "ASAP",
  visibility: "PUBLIC",
  publishOn: null,
  durationMonths: 2,
  channels: ["PLATFORM"],
  applicationMode: "SIMPLE",
};

/** [title, department, skills, status, days since publication, days until deadline, applicants, views] */
const DEMO: [string, string, string[], "PUBLISHED" | "DRAFT", number, number, number, number][] = [
  [
    "Power Platform Developer",
    "IT",
    ["Power Apps", "Power Automate", "Dataverse"],
    "PUBLISHED",
    12,
    38,
    48,
    612,
  ],
  ["Data Analyst", "IT", ["Power BI", "SQL", "Data Analysis"], "PUBLISHED", 17, 30, 32, 455],
  ["IT Support Specialist", "IT", ["IT Support", "Office 365", "Troubleshooting"], "DRAFT", 0, 0, 0, 0],
  [
    "Logistics Operations Manager",
    "Opérations",
    ["Logistics", "Supply Chain", "Management"],
    "PUBLISHED",
    22,
    25,
    56,
    804,
  ],
  ["Business Analyst", "Direction", ["Analyse métier", "Processus", "UAT"], "PUBLISHED", 27, 20, 24, 366],
  [
    "Commercial Senior",
    "Commercial",
    ["Vente", "Négociation", "Relation client"],
    "PUBLISHED",
    32,
    14,
    42,
    590,
  ],
  [
    "Responsable RH",
    "Ressources Humaines",
    ["Ressources Humaines", "Recrutement", "Formation"],
    "PUBLISHED",
    67,
    -6,
    18,
    321,
  ],
  ["Spécialiste QHSE", "Opérations", ["QHSE", "Sécurité", "Conformité"], "PUBLISHED", 40, 12, 21, 298],
  [
    "Chef de projet digital",
    "Direction",
    ["Gestion de projet", "Transformation", "Agilité"],
    "PUBLISHED",
    50,
    9,
    37,
    540,
  ],
  ["Comptable senior", "Finance", ["Comptabilité", "Audit", "Excel"], "DRAFT", 0, 0, 0, 0],
  ["Technicien réseau", "IT", ["Réseau", "Cisco", "Support IT"], "DRAFT", 0, 0, 0, 0],
];

/**
 * In-memory job offers. The first call fills the demo organization with the offers of the mockup and publishes
 * the public ones on the talent job board.
 */
export class InMemoryJobOfferRepository implements JobOfferRepository {
  private rows: StoredOffer[] = [];
  private ready: Promise<void>;

  constructor(
    demoProfileId: string | undefined,
    private readonly orgs: OrganizationRepository,
    private readonly opportunities: InMemoryOpportunityRepository,
  ) {
    this.ready = demoProfileId ? this.seed(demoProfileId) : Promise.resolve();
  }

  private async seed(profileId: string) {
    const scope = await this.orgs.findMembershipByProfile(profileId);
    if (!scope) return;
    const { organization, member } = scope;
    const departments = await this.orgs.listDepartments(organization.id);
    const now = new Date();
    for (const [title, department, skills, status, ago, until, applicants, views] of DEMO) {
      const published = status === "PUBLISHED";
      const publishedAt = published ? new Date(now.getTime() - ago * DAY_MS).toISOString() : null;
      const offer: StoredOffer = {
        ...BASE,
        id: randomUUID(),
        orgId: organization.id,
        title,
        description: `${organization.name} recherche un(e) ${title} pour rejoindre son équipe.\n\n- Analyser les besoins et proposer des solutions adaptées\n- Collaborer avec les équipes métiers et techniques\n- Assurer la qualité et la documentation`,
        departmentId: departments.find((d) => d.name === department)?.id ?? null,
        skills,
        deadline: published ? dayOf(new Date(now.getTime() + until * DAY_MS)) : null,
        publishOn: publishedAt ? publishedAt.slice(0, 10) : null,
        status,
        opportunityId: null,
        createdById: member.id,
        publishedAt,
        createdAt: publishedAt ?? new Date(now.getTime() - 2 * DAY_MS).toISOString(),
      };
      if (published) {
        const id = await this.opportunities.upsertFromOffer(
          offer.id,
          toOpportunityInput(offer, organization, now),
        );
        this.opportunities.seedStats(id, views, applicants);
        offer.opportunityId = id;
      }
      this.rows.push(offer);
    }
  }

  private view = ({ orgId, ...offer }: StoredOffer): JobOfferDTO => {
    void orgId;
    return { ...offer, skills: [...offer.skills], channels: [...offer.channels] };
  };

  async list(orgId: string) {
    await this.ready;
    return this.rows
      .filter((o) => o.orgId === orgId)
      .map(this.view)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(orgId: string, id: string) {
    await this.ready;
    const row = this.rows.find((o) => o.orgId === orgId && o.id === id);
    return row ? this.view(row) : null;
  }

  async create(orgId: string, input: JobOfferInput, createdById: string | null) {
    await this.ready;
    const row: StoredOffer = {
      ...input,
      id: randomUUID(),
      orgId,
      status: "DRAFT",
      opportunityId: null,
      createdById,
      publishedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.rows.push(row);
    return this.view(row);
  }

  async update(orgId: string, id: string, input: JobOfferInput) {
    await this.ready;
    const row = this.rows.find((o) => o.orgId === orgId && o.id === id);
    if (!row) return null;
    Object.assign(row, input);
    return this.view(row);
  }

  async setPublication(orgId: string, id: string, p: JobPublication) {
    await this.ready;
    const row = this.rows.find((o) => o.orgId === orgId && o.id === id);
    if (!row) return null;
    Object.assign(row, p);
    return this.view(row);
  }

  async delete(orgId: string, id: string) {
    await this.ready;
    const index = this.rows.findIndex((o) => o.orgId === orgId && o.id === id);
    if (index === -1) return null;
    const [removed] = this.rows.splice(index, 1);
    return this.view(removed);
  }
}
