"use server";

import { revalidatePath } from "next/cache";
import { businessAction } from "@/lib/business/action";
import { ForbiddenError } from "@/lib/errors";
import { evaluationSchema, publishableEvaluationSchema } from "@/schemas/evaluation";
import { getEvaluationService } from "@/services/container";
import type { EvaluationInput } from "@/types/evaluation";

const refresh = () => revalidatePath("/business", "layout");

/** Creating or editing a test needs the right to create tests or to modify them. */
const canWrite = (can: (p: string) => boolean) => can("evaluations.create") || can("evaluations.edit");

/** Saves a test as a draft, or publishes it. Publishing needs a complete test. */
export async function saveEvaluationAction(
  id: string | null,
  values: unknown,
  publish: boolean,
): Promise<{ id?: string; error?: string }> {
  const result = await businessAction(null, async (ctx) => {
    if (!canWrite(ctx.can) || (!id && !ctx.can("evaluations.create"))) {
      throw new ForbiddenError("Vous n'avez pas l'autorisation de créer des évaluations.");
    }
    const input = (publish ? publishableEvaluationSchema : evaluationSchema).parse(values) as EvaluationInput;
    const evaluation = await getEvaluationService().save(ctx, id, input, publish, ctx.member.id);
    return evaluation.id;
  });
  refresh();
  return result.error ? { error: result.error } : { id: result.data };
}

export async function publishEvaluationAction(id: string) {
  const result = await businessAction("evaluations.edit", (ctx) => getEvaluationService().publish(ctx, id));
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function archiveEvaluationAction(id: string) {
  const result = await businessAction("evaluations.edit", (ctx) => getEvaluationService().archive(ctx, id));
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function restoreEvaluationAction(id: string) {
  const result = await businessAction("evaluations.edit", (ctx) => getEvaluationService().restore(ctx, id));
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function duplicateEvaluationAction(id: string) {
  const result = await businessAction("evaluations.create", (ctx) =>
    getEvaluationService().duplicate(ctx, id, ctx.member.id),
  );
  refresh();
  return result.error !== undefined ? { error: result.error } : { id: result.data.id };
}

export async function deleteEvaluationAction(id: string) {
  const result = await businessAction("evaluations.delete", (ctx) => getEvaluationService().remove(ctx, id));
  refresh();
  return result.error ? { error: result.error } : {};
}
