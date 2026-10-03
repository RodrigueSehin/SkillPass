import { config } from "dotenv";

// Next.js reads .env.local; Prisma tooling and the seed must read the same file.
config({ path: ".env.local" });
config();
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Fixed UUID: when seeding against Supabase, replace with a real auth.users id.
const DEMO_PROFILE_ID = process.env.SEED_PROFILE_ID ?? "00000000-0000-4000-8000-000000000001";

const CATEGORIES = [
  { name: "Power Platform", slug: "power-platform" },
  { name: "Data & Analytics", slug: "data-analytics" },
  { name: "AI & Automation", slug: "ai-automation" },
  { name: "Transformation & Design", slug: "transformation-design" },
];

const SKILLS = [
  {
    name: "Power Apps",
    category: "power-platform",
    level: "EXPERT",
    score: 95,
    years: 5,
    status: "VERIFIED",
  },
  {
    name: "Power Automate",
    category: "power-platform",
    level: "ADVANCED",
    score: 82,
    years: 5,
    status: "VERIFIED",
  },
  {
    name: "Dataverse",
    category: "power-platform",
    level: "ADVANCED",
    score: 80,
    years: 4,
    status: "VERIFIED",
  },
  {
    name: "Power BI",
    category: "data-analytics",
    level: "ADVANCED",
    score: 78,
    years: 3,
    status: "VERIFIED",
  },
  {
    name: "AI & Automation",
    category: "ai-automation",
    level: "INTERMEDIATE",
    score: 65,
    years: 2,
    status: "PENDING",
  },
  {
    name: "Digital Transformation",
    category: "transformation-design",
    level: "ADVANCED",
    score: 76,
    years: 4,
    status: "UNVERIFIED",
  },
  {
    name: "UI/UX",
    category: "transformation-design",
    level: "INTERMEDIATE",
    score: 60,
    years: 3,
    status: "UNVERIFIED",
  },
] as const;

const PROJECTS = [
  {
    name: "A' Quotation",
    role: "Power Platform Developer",
    skills: ["Power Apps", "Dataverse", "Power Automate"],
  },
  { name: "MODOCK", role: "Solution Architect", skills: ["Power Apps", "Power BI"] },
  { name: "K@PELE", role: "Power Platform Developer", skills: ["Power Apps", "Dataverse"] },
  { name: "CRUISE", role: "Digital Transformation Lead", skills: ["Power Automate", "AI & Automation"] },
];

const CERTIFICATIONS = [
  { name: "PL-200: Power Platform Functional Consultant", issuer: "Microsoft", credentialId: "PL-200" },
  { name: "Power BI Data Analyst (PL-300)", issuer: "Microsoft", credentialId: "PL-300" },
  { name: "Azure AI Fundamentals (AI-900)", issuer: "Microsoft", credentialId: "AI-900" },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  const categoryIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.skillCategory.upsert({ where: { slug: c.slug }, update: {}, create: c });
    categoryIds.set(c.slug, row.id);
  }

  const profile = await prisma.profile.upsert({
    where: { id: DEMO_PROFILE_ID },
    update: {},
    create: {
      id: DEMO_PROFILE_ID,
      email: "sehin@example.com",
      username: "sehin-rodrigue",
      fullName: "Sehin G. Rodrigue",
      headline: "Power Platform Developer & Digital Transformation Specialist",
      location: "Abidjan, Côte d'Ivoire",
      profession: "Power Platform Developer",
      yearsOfExperience: 5,
      careerGoal: "Concevoir des solutions métiers à fort impact.",
    },
  });

  const skillIds = new Map<string, string>();
  for (const s of SKILLS) {
    const skill = await prisma.skill.upsert({
      where: { slug: slugify(s.name) },
      update: {},
      create: { name: s.name, slug: slugify(s.name), categoryId: categoryIds.get(s.category) },
    });
    skillIds.set(s.name, skill.id);
    await prisma.talentSkill.upsert({
      where: { profileId_skillId: { profileId: profile.id, skillId: skill.id } },
      update: {},
      create: {
        profileId: profile.id,
        skillId: skill.id,
        level: s.level,
        score: s.score,
        yearsOfExperience: s.years,
        verificationStatus: s.status,
      },
    });
  }

  if ((await prisma.project.count({ where: { profileId: profile.id } })) === 0) {
    for (const p of PROJECTS) {
      await prisma.project.create({
        data: {
          profileId: profile.id,
          name: p.name,
          role: p.role,
          skills: { create: p.skills.map((name) => ({ skillId: skillIds.get(name)! })) },
        },
      });
    }
  }

  if ((await prisma.certification.count({ where: { profileId: profile.id } })) === 0) {
    await prisma.certification.createMany({
      data: CERTIFICATIONS.map((c) => ({
        ...c,
        profileId: profile.id,
        issueDate: new Date("2025-06-01"),
        verificationStatus: "VERIFIED" as const,
      })),
    });
  }

  console.log(`Seeded profile ${profile.username} with ${SKILLS.length} skills.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
