import type { Availability } from "@/types/profile";
import type { SkillLevel } from "@/types/skill";
import type { TalentDetail, TalentRecord } from "@/types/talent";
import type { TalentDirectoryRepository } from "./talent-directory.repository";

type SeedSkill = [name: string, level: SkillLevel, verified?: boolean];
interface Seed {
  name: string;
  profession: string;
  city: string;
  years: number;
  availability: Availability;
  skills: SeedSkill[];
  certs: [name: string, issuer: string, date: string, verified?: boolean][];
  projects: number;
  recos: number;
}

const CATEGORIES: Record<string, string> = {
  "Power Apps": "Power Platform",
  "Power Automate": "Power Platform",
  Dataverse: "Power Platform",
  "Power Platform": "Power Platform",
  "Power BI": "Data & Analytics",
  DAX: "Data & Analytics",
  SQL: "Base de données",
  "Data Analysis": "Data & Analytics",
  Excel: "Productivité",
  Azure: "Cloud",
  DevOps: "Cloud",
  "CI/CD": "Cloud",
  Git: "Développement",
  SharePoint: "Collaboration",
  TypeScript: "Développement",
  React: "Développement",
  "Node.js": "Développement",
  Python: "Développement",
  PostgreSQL: "Base de données",
  "Process Mining": "Data & Analytics",
  Agile: "Gestion de projet",
  "Change Management": "Gestion de projet",
  "UI/UX": "Design",
};

const SCORES: Record<SkillLevel, number> = { BEGINNER: 35, INTERMEDIATE: 62, ADVANCED: 82, EXPERT: 94 };

const SEEDS: Seed[] = [
  {
    name: "Sehin G. Rodrigue",
    profession: "Power Platform Developer",
    city: "Abidjan, Côte d'Ivoire",
    years: 5,
    availability: "IMMEDIATE",
    skills: [
      ["Power Apps", "EXPERT", true],
      ["Power Automate", "EXPERT", true],
      ["Dataverse", "ADVANCED", true],
      ["Power BI", "ADVANCED"],
      ["Azure", "INTERMEDIATE"],
    ],
    certs: [
      ["PL-200", "Microsoft", "2025-06-01", true],
      ["PL-400", "Microsoft", "2025-11-01"],
      ["Power BI Data Analyst", "Microsoft", "2024-03-01", true],
    ],
    projects: 12,
    recos: 4,
  },
  {
    name: "Aïcha Koné",
    profession: "Data Analyst | Power BI Specialist",
    city: "Abidjan, Côte d'Ivoire",
    years: 4,
    availability: "IMMEDIATE",
    skills: [
      ["Power BI", "EXPERT", true],
      ["SQL", "ADVANCED", true],
      ["Data Analysis", "ADVANCED"],
      ["Excel", "EXPERT"],
      ["DAX", "ADVANCED"],
    ],
    certs: [
      ["Power BI Data Analyst", "Microsoft", "2024-09-01", true],
      ["Azure Fundamentals", "Microsoft", "2023-05-01"],
    ],
    projects: 8,
    recos: 3,
  },
  {
    name: "Jean Marc Kouakou",
    profession: "Business Analyst",
    city: "Abidjan, Côte d'Ivoire",
    years: 6,
    availability: "IMMEDIATE",
    skills: [
      ["Power Platform", "ADVANCED", true],
      ["Process Mining", "INTERMEDIATE"],
      ["UAT", "ADVANCED"],
      ["Requirements", "EXPERT"],
    ],
    certs: [["PL-200", "Microsoft", "2023-10-01"]],
    projects: 9,
    recos: 2,
  },
  {
    name: "Marie K. Yao",
    profession: "Développeuse Power Apps",
    city: "Abidjan, Côte d'Ivoire",
    years: 3,
    availability: "ONE_MONTH",
    skills: [
      ["Power Apps", "ADVANCED", true],
      ["Power Automate", "INTERMEDIATE"],
      ["SharePoint", "ADVANCED"],
      ["UI/UX", "INTERMEDIATE"],
    ],
    certs: [["PL-900", "Microsoft", "2024-02-01", true]],
    projects: 5,
    recos: 1,
  },
  {
    name: "Koffi D. N'Guessan",
    profession: "DevOps & Power Platform",
    city: "Abidjan, Côte d'Ivoire",
    years: 5,
    availability: "IMMEDIATE",
    skills: [
      ["Azure", "EXPERT", true],
      ["Power Platform", "ADVANCED"],
      ["DevOps", "EXPERT"],
      ["CI/CD", "ADVANCED"],
      ["Git", "EXPERT"],
    ],
    certs: [
      ["AZ-104", "Microsoft", "2024-06-01", true],
      ["PL-400", "Microsoft", "2025-01-01"],
    ],
    projects: 7,
    recos: 2,
  },
  {
    name: "Fatou B. Traoré",
    profession: "Consultante Transformation Digitale",
    city: "Abidjan, Côte d'Ivoire",
    years: 7,
    availability: "IMMEDIATE",
    skills: [
      ["Power Platform", "ADVANCED"],
      ["Change Management", "EXPERT", true],
      ["Agile", "ADVANCED"],
      ["Power BI", "INTERMEDIATE"],
    ],
    certs: [
      ["PL-200", "Microsoft", "2022-09-01"],
      ["PMP", "PMI", "2021-04-01", true],
    ],
    projects: 11,
    recos: 5,
  },
  {
    name: "Ibrahim Sow",
    profession: "Développeur Full Stack",
    city: "Dakar, Sénégal",
    years: 4,
    availability: "THREE_MONTHS",
    skills: [
      ["TypeScript", "ADVANCED", true],
      ["React", "EXPERT"],
      ["Node.js", "ADVANCED"],
      ["PostgreSQL", "INTERMEDIATE"],
    ],
    certs: [["AZ-204", "Microsoft", "2024-01-01"]],
    projects: 6,
    recos: 1,
  },
  {
    name: "Nadia El Amrani",
    profession: "Data Engineer",
    city: "Casablanca, Maroc",
    years: 6,
    availability: "ONE_MONTH",
    skills: [
      ["SQL", "EXPERT", true],
      ["Python", "ADVANCED"],
      ["Azure", "ADVANCED"],
      ["Power BI", "ADVANCED"],
    ],
    certs: [
      ["DP-203", "Microsoft", "2024-08-01", true],
      ["Azure Fundamentals", "Microsoft", "2022-02-01"],
    ],
    projects: 8,
    recos: 2,
  },
];

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function build(seed: Seed): TalentRecord {
  return {
    id: `demo-talent-${slug(seed.name)}`,
    username: slug(seed.name),
    fullName: seed.name,
    headline: seed.profession,
    profession: seed.profession,
    location: seed.city,
    yearsOfExperience: seed.years,
    availability: seed.availability,
    updatedAt: new Date().toISOString(),
    skills: seed.skills.map(([name, level, verified]) => ({
      name,
      category: CATEGORIES[name] ?? null,
      level,
      score: SCORES[level],
      verified: Boolean(verified),
      evidenceCount: verified ? 2 : 0,
    })),
    certifications: seed.certs.map(([name, issuer, date, verified]) => ({
      name,
      issuer,
      date,
      verified: Boolean(verified),
      expired: false,
    })),
    projectCount: seed.projects,
    recommendationCount: seed.recos,
  };
}

/** Demo-mode directory: a handful of fictional public profiles. Never used with a database. */
export class InMemoryTalentDirectoryRepository implements TalentDirectoryRepository {
  private readonly records = SEEDS.map(build);

  async listPublic(limit: number) {
    return this.records.slice(0, limit);
  }

  async detail(username: string): Promise<TalentDetail | null> {
    const record = this.records.find((r) => r.username === username);
    if (!record) return null;
    return {
      record,
      projects: [
        {
          name: "Suivi des demandes internes",
          organization: "Entreprise cliente",
          domain: record.skills[0]?.name ?? null,
        },
        {
          name: "Tableau de bord de pilotage",
          organization: "Entreprise cliente",
          domain: record.skills[1]?.name ?? null,
        },
      ],
      experiences: [
        {
          title: record.profession ?? "Consultant",
          company: "Cabinet de conseil",
          startDate: "2022-01-01",
          endDate: null,
        },
      ],
    };
  }
}
