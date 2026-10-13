import type { CrudService } from "@/lib/crud";
import { AppError } from "@/lib/errors";
import { UploadError, validateUpload, type UploadedFile } from "@/lib/storage/uploads";
import { createCertificationSchema, createExperienceSchema } from "@/schemas/portfolio";
import { createTalentSkillSchema } from "@/schemas/skill";
import type { CvImportResult, CvKind, CvProposal } from "@/types/cv-import";
import type { CertificationDTO, ExperienceDTO } from "@/types/portfolio";
import type { AIService } from "./ai.service";
import type { SkillService } from "./skill.service";

type Experiences = CrudService<ExperienceDTO, unknown>;
type Certifications = CrudService<CertificationDTO, unknown>;

const key = (...parts: string[]) => parts.map((p) => p.trim().toLowerCase()).join("|");

/**
 * Fills a profile from a CV, in two steps with the person in between: `analyze` only reads and proposes,
 * `importSelection` creates what was ticked, through the same validation and plan limits as the forms.
 */
export class CvImportService {
  constructor(
    private readonly ai: AIService,
    private readonly skills: SkillService,
    private readonly experiences: Experiences,
    private readonly certifications: Certifications,
  ) {}

  get enabled() {
    return this.ai.enabled;
  }

  async analyze(profileId: string, file: UploadedFile): Promise<CvProposal> {
    const { ext } = validateUpload(file);
    if (ext !== "pdf") throw new UploadError("Importez votre CV au format PDF.");

    const cv = await this.ai.extractCv(file.bytes);
    const [skills, experiences, certifications] = await Promise.all([
      this.skills.list(profileId),
      this.experiences.list(profileId),
      this.certifications.list(profileId),
    ]);
    const haveSkills = new Set(skills.items.map((s) => key(s.name)));
    const haveExperiences = new Set(experiences.map((e) => key(e.company, e.title, e.startDate)));
    const haveCertifications = new Set(certifications.map((c) => key(c.name, c.issuer)));

    return {
      skills: cv.skills.map((s) => ({ ...s, exists: haveSkills.has(key(s.name)) })),
      experiences: cv.experiences.map((e) => ({
        ...e,
        exists: haveExperiences.has(key(e.company, e.title, e.startDate)),
      })),
      certifications: cv.certifications.map((c) => ({
        ...c,
        exists: haveCertifications.has(key(c.name, c.issuer)),
      })),
    };
  }

  /** Items arrive from the browser: each goes through the schema of its own form, one by one. */
  async importSelection(
    profileId: string,
    selection: { skills?: unknown[]; experiences?: unknown[]; certifications?: unknown[] },
  ): Promise<CvImportResult> {
    const result: CvImportResult = {
      imported: { skills: 0, experiences: 0, certifications: 0 },
      skipped: [],
    };
    const run = async (
      kind: CvKind,
      items: unknown[] | undefined,
      label: (i: unknown) => string,
      add: (i: unknown) => Promise<unknown>,
    ) => {
      for (const item of (items ?? []).slice(0, 40)) {
        try {
          await add(item);
          result.imported[kind]++;
        } catch (err) {
          const reason =
            err instanceof AppError
              ? err.message
              : err instanceof Error && "issues" in err
                ? ((err as { issues: { message: string }[] }).issues[0]?.message ?? "Données invalides")
                : "Données invalides";
          result.skipped.push({ kind, label: label(item), reason });
        }
      }
    };
    const name = (field: string) => (i: unknown) =>
      String((i as Record<string, unknown> | null)?.[field] ?? "—");

    await run("skills", selection.skills, name("name"), (i) =>
      this.skills.add(profileId, createTalentSkillSchema.parse(i)),
    );
    await run("experiences", selection.experiences, name("title"), (i) =>
      this.experiences.add(profileId, createExperienceSchema.parse(i)),
    );
    await run("certifications", selection.certifications, name("name"), (i) =>
      this.certifications.add(profileId, createCertificationSchema.parse(i)),
    );
    return result;
  }
}
