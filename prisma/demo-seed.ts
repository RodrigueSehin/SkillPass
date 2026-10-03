/**
 * Demo data for a real Supabase project.
 *
 *   npm run demo:seed            → shows the target and does nothing
 *   npm run demo:seed -- --yes   → creates the demo accounts and (re)builds their data
 *
 * What it touches: the Supabase Auth users for DEMO_EMAIL / VERIFIER_EMAIL (created if missing)
 * and the rows owned by those two profiles. Re-running resets the demo talent's data to the
 * same state. Nothing belonging to other users is read or written.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { ASSESSMENT_BANK, BANK_VERSION } from "../src/config/assessment-bank";
import {
  DEMO_CERTIFICATIONS,
  DEMO_EVIDENCE,
  DEMO_EXPERIENCES,
  DEMO_PROJECT_ROWS,
  DEMO_SKILL_ROWS,
} from "../src/config/demo-data";
import { scoreAttempt } from "../src/lib/assessment-scoring";
import { generateCredentialId } from "../src/repositories/credential.repository";

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@skillpass-demo.com";
const VERIFIER_EMAIL = process.env.VERIFIER_EMAIL ?? "verificateur@skillpass-demo.com";
const DEMO_USERNAME = "sehin-rodrigue";
const VERIFIER_USERNAME = "verificateur-demo";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
const day = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00.000Z`) : null);

function requireEnv(...names: string[]) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    console.error(`Variables manquantes dans .env.local : ${missing.join(", ")}`);
    process.exit(1);
  }
}

function describeTarget() {
  const host = (value: string | undefined) => {
    try {
      return new URL(value ?? "").hostname;
    } catch {
      return "(URL invalide)";
    }
  };
  return { supabase: host(process.env.NEXT_PUBLIC_SUPABASE_URL), database: host(process.env.DATABASE_URL) };
}

async function main() {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL");
  const target = describeTarget();
  console.log(`Cible : Supabase ${target.supabase} · base ${target.database}`);
  if (target.database === "localhost" || target.database === "(URL invalide)") {
    console.error(
      "DATABASE_URL pointe vers localhost ou n'est pas valide : renseignez l'URL Postgres de Supabase.",
    );
    process.exit(1);
  }
  if (!process.argv.includes("--yes")) {
    console.log(
      "Rien n'a été modifié. Relancez avec --yes pour créer les comptes et les données de démonstration.",
    );
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    },
  );
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

  try {
    const accounts: { email: string; password?: string; note: string }[] = [];

    async function ensureAuthUser(email: string, fullName: string) {
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw new Error(`Supabase Auth indisponible : ${error.message}`);
        const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (found) {
          if (process.env.DEMO_PASSWORD) {
            await supabase.auth.admin.updateUserById(found.id, { password: process.env.DEMO_PASSWORD });
          }
          return { id: found.id, password: process.env.DEMO_PASSWORD };
        }
        if (data.users.length < 200) break;
      }
      const password = process.env.DEMO_PASSWORD ?? `${randomBytes(9).toString("base64url")}!aA1`;
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error || !data.user) throw new Error(`Création du compte ${email} impossible : ${error?.message}`);
      return { id: data.user.id, password };
    }

    async function upsertProfile(
      id: string,
      data: {
        email: string;
        username: string;
        fullName: string;
        role: "TALENT" | "VERIFIER";
        isPublic: boolean;
        headline?: string;
        bio?: string;
        location?: string;
        profession?: string;
        yearsOfExperience?: number;
        careerGoal?: string;
      },
    ) {
      const clash = await prisma.profile.findUnique({ where: { username: data.username } });
      if (clash && clash.id !== id) {
        throw new Error(`Le nom d'utilisateur « ${data.username} » est déjà pris par un autre compte.`);
      }
      return prisma.profile.upsert({ where: { id }, update: data, create: { id, ...data } });
    }

    // ---------- Accounts and profiles ----------
    const demoAuth = await ensureAuthUser(DEMO_EMAIL, "Sehin G. Rodrigue");
    accounts.push({ email: DEMO_EMAIL, password: demoAuth.password, note: "talent de démonstration" });
    const verifierAuth = await ensureAuthUser(VERIFIER_EMAIL, "Awa Koné");
    accounts.push({
      email: VERIFIER_EMAIL,
      password: verifierAuth.password,
      note: "vérificatrice (rôle VERIFIER)",
    });

    const talent = await upsertProfile(demoAuth.id, {
      email: DEMO_EMAIL,
      username: DEMO_USERNAME,
      fullName: "Sehin G. Rodrigue",
      role: "TALENT",
      isPublic: true,
      headline: "Power Platform Developer & Digital Transformation Specialist",
      bio: "Je conçois des solutions métiers simples et efficaces avec la Power Platform, de l'idée au déploiement.",
      location: "Abidjan, Côte d'Ivoire",
      profession: "Power Platform Developer",
      yearsOfExperience: 5,
      careerGoal: "Concevoir des solutions métiers à fort impact.",
    });
    const verifier = await upsertProfile(verifierAuth.id, {
      email: VERIFIER_EMAIL,
      username: VERIFIER_USERNAME,
      fullName: "Awa Koné",
      role: "VERIFIER",
      isPublic: false,
      headline: "Vérificatrice SkillPass",
    });

    // ---------- Reset the demo talent's own data (FK-safe order) ----------
    const owner = { profileId: talent.id };
    await prisma.skillEvidence.deleteMany({ where: owner });
    await prisma.recommendation.deleteMany({ where: owner });
    await prisma.credential.deleteMany({ where: owner });
    await prisma.assessmentAttempt.deleteMany({ where: owner });
    await prisma.project.deleteMany({ where: owner });
    await prisma.talentSkill.deleteMany({ where: owner });
    await prisma.experience.deleteMany({ where: owner });
    await prisma.certification.deleteMany({ where: owner });

    // ---------- Skills ----------
    const skillIds = new Map<string, string>();
    const talentSkillIds = new Map<string, string>();
    for (const row of DEMO_SKILL_ROWS) {
      const category = await prisma.skillCategory.upsert({
        where: { slug: slugify(row.category) },
        update: {},
        create: { name: row.category, slug: slugify(row.category) },
      });
      const skill = await prisma.skill.upsert({
        where: { slug: slugify(row.name) },
        update: {},
        create: { name: row.name, slug: slugify(row.name), categoryId: category.id },
      });
      skillIds.set(row.name, skill.id);

      // Scores of assessed skills come from the attempts below; the others are declared/verified by evidence.
      const talentSkill = await prisma.talentSkill.create({
        data: {
          profileId: talent.id,
          skillId: skill.id,
          level: row.level,
          score: row.score,
          yearsOfExperience: row.yearsOfExperience,
          verificationStatus: row.name === "Dataverse" ? "PENDING" : row.verificationStatus,
        },
      });
      talentSkillIds.set(row.name, talentSkill.id);
    }

    // ---------- Projects, experiences, certifications ----------
    for (const p of DEMO_PROJECT_ROWS) {
      await prisma.project.create({
        data: {
          profileId: talent.id,
          name: p.name,
          description: p.description,
          organization: p.organization,
          role: p.role,
          startDate: day(p.startDate),
          endDate: day(p.endDate),
          skills: { create: p.skills.map((name) => ({ skillId: skillIds.get(name)! })) },
        },
      });
    }
    for (const e of DEMO_EXPERIENCES) {
      await prisma.experience.create({
        data: {
          profileId: talent.id,
          title: e.title,
          company: e.company,
          location: e.location,
          description: e.description,
          startDate: day(e.startDate)!,
          endDate: day(e.endDate),
        },
      });
    }
    for (const c of DEMO_CERTIFICATIONS) {
      await prisma.certification.create({
        data: {
          profileId: talent.id,
          name: c.name,
          issuer: c.issuer,
          issueDate: day(c.issueDate)!,
          expirationDate: day(c.expirationDate),
          credentialId: c.credentialId,
          verificationStatus: c.verificationStatus,
        },
      });
    }

    // ---------- Evidence ----------
    for (const e of DEMO_EVIDENCE) {
      await prisma.skillEvidence.create({
        data: {
          profileId: talent.id,
          talentSkillId: talentSkillIds.get(e.skill)!,
          type: e.type,
          title: e.title,
          description: e.description,
          url: "url" in e ? e.url : null,
          status: e.status,
        },
      });
    }

    // ---------- Assessments, credentials (badges) and one pending review ----------
    const issued: { skill: string; credentialId: string }[] = [];
    const attemptFor = async (
      slug: string,
      wrongCount: number,
      status: "PASSED" | "PENDING_REVIEW",
      ago: number,
    ) => {
      const assessment = ASSESSMENT_BANK.find((a) => a.slug === slug)!;
      const answers = assessment.questions.map((q, i) => ({
        questionId: q.id,
        selected: i < wrongCount ? (q.correctIndex + 1) % q.options.length : q.correctIndex,
      }));
      const scored = scoreAttempt(assessment, answers);
      const startedAt = daysAgo(ago);
      return {
        assessment,
        scored,
        attempt: await prisma.assessmentAttempt.create({
          data: {
            profileId: talent.id,
            talentSkillId: talentSkillIds.get(assessment.skillName)!,
            assessmentSlug: slug,
            bankVersion: BANK_VERSION,
            status,
            startedAt,
            deadlineAt: new Date(startedAt.getTime() + assessment.durationMinutes * 60_000),
            submittedAt: new Date(startedAt.getTime() + 11 * 60_000),
            answers,
            overallScore: scored.overall,
            domainScores: scored.domainScores,
            level: scored.level,
          },
        }),
      };
    };

    for (const [slug, wrong, ago] of [
      ["power-apps", 0, 120],
      ["power-automate", 1, 75],
    ] as const) {
      const { assessment, scored, attempt } = await attemptFor(slug, wrong, "PASSED", ago);
      await prisma.talentSkill.update({
        where: { id: talentSkillIds.get(assessment.skillName)! },
        data: { level: scored.level!, score: scored.overall, verificationStatus: "VERIFIED" },
      });
      const issuedAt = attempt.startedAt;
      const credentialId = generateCredentialId();
      await prisma.credential.create({
        data: {
          credentialId,
          profileId: talent.id,
          talentSkillId: talentSkillIds.get(assessment.skillName)!,
          skillName: assessment.skillName,
          level: scored.level!,
          issuedAt,
          expiresAt: new Date(issuedAt.getTime() + 2 * 365 * 86_400_000),
          attemptId: attempt.id,
        },
      });
      issued.push({ skill: assessment.skillName, credentialId });
    }
    // Dataverse is a critical assessment: passed, waiting for the verifier (visible on /admin/verifications).
    await attemptFor("dataverse", 1, "PENDING_REVIEW", 2);

    // ---------- Recommendations ----------
    const reco = (
      authorName: string,
      authorTitle: string,
      skill: string | null,
      status: "APPROVED" | "SUBMITTED" | "REQUESTED",
      content: string | null,
      ago: number,
    ) =>
      prisma.recommendation.create({
        data: {
          profileId: talent.id,
          talentSkillId: skill ? talentSkillIds.get(skill)! : null,
          token: randomBytes(32).toString("hex"),
          authorName,
          authorTitle: content ? authorTitle : null,
          content,
          status,
          createdAt: daysAgo(ago + 3),
          submittedAt: content ? daysAgo(ago) : null,
          expiresAt: new Date(Date.now() + 30 * 86_400_000),
        },
      });
    await reco(
      "Awa Koné",
      "Directrice des systèmes d'information, AGL",
      "Power Apps",
      "APPROVED",
      "Sehin possède une excellente maîtrise de Power Apps et sait transformer des besoins métiers complexes en solutions simples et efficaces. Il a livré A' Quotation dans les délais et l'application est adoptée par toute l'équipe commerciale.",
      60,
    );
    await reco(
      "Jean-Marc Yao",
      "Chef de projet, Groupe KAP",
      "Dataverse",
      "APPROVED",
      "Un modèle de données propre et une vraie rigueur sur la sécurité par rôles. Sehin explique ses choix et forme les équipes avec patience.",
      45,
    );
    await reco(
      "Fatou Diallo",
      "Responsable des opérations, CRUISE",
      "Power Automate",
      "APPROVED",
      "Les automatisations qu'il a mises en place nous ont fait gagner plusieurs heures par semaine. Fiable, réactif et très à l'écoute.",
      20,
    );
    await reco(
      "Mamadou Traoré",
      "Directeur technique, MODOCK",
      null,
      "SUBMITTED",
      "Collaboration exemplaire sur le pilotage logistique : Sehin a su embarquer les utilisateurs dès la conception et livrer des tableaux de bord que nous utilisons chaque jour.",
      2,
    );
    const open = await reco("Aïcha Bamba", "", "Power BI", "REQUESTED", null, 0);

    // ---------- Summary ----------
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    console.log("\n✔ Démo prête\n");
    console.log("Comptes :");
    for (const a of accounts) {
      console.log(`  ${a.email}  (${a.note})  mot de passe : ${a.password ?? "déjà existant — inchangé"}`);
    }
    console.log("\nÀ montrer :");
    console.log(`  Connexion             ${base}/login`);
    console.log(`  Profil public         ${base}/${DEMO_USERNAME}`);
    for (const c of issued) console.log(`  Badge ${c.skill.padEnd(15)} ${base}/verify/${c.credentialId}`);
    console.log(
      `  Validation (verif.)   ${base}/admin/verifications   → connecté en tant que ${VERIFIER_EMAIL}`,
    );
    console.log(`  Lien de recommandation ouvert  ${base}/recommend/${open.token}`);
    console.log(`\nProfils créés : ${talent.username}, ${verifier.username}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("\n✘ Échec :", err instanceof Error ? err.message : err);
  process.exit(1);
});
