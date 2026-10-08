"use server";

import { revalidatePath } from "next/cache";
import { businessAction } from "@/lib/business/action";
import { canManageSkills } from "@/lib/business/skill-access";
import { ForbiddenError } from "@/lib/errors";
import { orgSkillSchema } from "@/schemas/org-skill";
import { getOrgSkillService } from "@/services/container";

const refresh = () => revalidatePath("/business", "layout");
const DENIED = "Vous n'avez pas l'autorisation de modifier le référentiel.";

export async function saveOrgSkillAction(
  id: string | null,
  values: unknown,
): Promise<{ id?: string; error?: string }> {
  const result = await businessAction(null, async (ctx) => {
    if (!canManageSkills(ctx.can)) throw new ForbiddenError(DENIED);
    const input = orgSkillSchema.parse(values);
    const skill = id
      ? await getOrgSkillService().update(ctx.organization.id, id, input)
      : await getOrgSkillService().create(ctx.organization.id, input);
    return skill.id;
  });
  refresh();
  return result.error ? { error: result.error } : { id: result.data };
}

export async function deleteOrgSkillAction(id: string): Promise<{ error?: string }> {
  const result = await businessAction(null, async (ctx) => {
    if (!canManageSkills(ctx.can)) throw new ForbiddenError(DENIED);
    await getOrgSkillService().remove(ctx.organization.id, id);
  });
  refresh();
  return result.error ? { error: result.error } : {};
}
