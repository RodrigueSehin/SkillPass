"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth/current-user";
import { profileFor } from "@/lib/auth/profile";
import { businessAction } from "@/lib/business/action";
import { AppError } from "@/lib/errors";
import { appUrl } from "@/lib/utils/app-url";
import {
  createOrganizationSchema,
  departmentSchema,
  inviteMemberSchema,
  siteSchema,
  updateMemberSchema,
  updateOrganizationSchema,
} from "@/schemas/business";
import { getOrganizationService } from "@/services/container";

const refresh = () => revalidatePath("/business", "layout");

/** Creates the organization of a person who has none; they become its first administrator. */
export async function createOrganizationAction(values: unknown): Promise<{ error?: string }> {
  const user = await requireUser();
  try {
    const profile = await profileFor(user);
    const [firstName, ...rest] = profile.fullName.trim().split(/\s+/);
    await getOrganizationService().create(
      { profileId: user.id, firstName: firstName ?? "", lastName: rest.join(" "), email: user.email },
      createOrganizationSchema.parse(values),
    );
    refresh();
    return {};
  } catch (err) {
    if (err instanceof ZodError) return { error: err.issues[0]?.message ?? "Données invalides" };
    if (err instanceof AppError) return { error: err.message };
    console.error("create organization failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}

/** Joins the organization behind an invitation link, as the signed-in person. */
export async function acceptInvitationAction(token: string): Promise<{ error?: string }> {
  const user = await requireUser();
  try {
    await profileFor(user);
    await getOrganizationService().acceptInvite(token, user.id);
    refresh();
    return {};
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    console.error("accept invitation failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}

export async function updateOrganizationAction(values: unknown) {
  const result = await businessAction("org.manage", (ctx) =>
    getOrganizationService().update(ctx.organization.id, updateOrganizationSchema.parse(values)),
  );
  refresh();
  return result.error ? { error: result.error } : {};
}

// ---------------------------------------------------------------- sites

export async function saveSiteAction(id: string | null, values: unknown) {
  const result = await businessAction("org.manage", (ctx) => {
    const input = siteSchema.parse(values);
    return id
      ? getOrganizationService().updateSite(ctx.organization.id, id, input)
      : getOrganizationService().createSite(ctx.organization.id, input);
  });
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function deleteSiteAction(id: string) {
  const result = await businessAction("org.manage", (ctx) =>
    getOrganizationService().deleteSite(ctx.organization.id, id),
  );
  refresh();
  return result.error ? { error: result.error } : {};
}

// ---------------------------------------------------------------- departments

export async function saveDepartmentAction(
  id: string | null,
  values: unknown,
): Promise<{ id?: string; error?: string }> {
  const result = await businessAction("team.manage", async (ctx) => {
    const input = departmentSchema.parse(values);
    const department = id
      ? await getOrganizationService().updateDepartment(ctx.organization.id, id, input)
      : await getOrganizationService().createDepartment(ctx.organization.id, input);
    return department.id;
  });
  refresh();
  return result.error ? { error: result.error } : { id: result.data };
}

export async function deleteDepartmentAction(id: string) {
  const result = await businessAction("team.manage", (ctx) =>
    getOrganizationService().deleteDepartment(ctx.organization.id, id),
  );
  refresh();
  return result.error ? { error: result.error } : {};
}

// ---------------------------------------------------------------- members

/** Creates the pending member and returns the link to send them (no e-mail is sent by SkillPass yet). */
export async function inviteMemberAction(values: unknown): Promise<{ link?: string; error?: string }> {
  const result = await businessAction("team.manage", async (ctx) => {
    const invited = await getOrganizationService().invite(ctx, inviteMemberSchema.parse(values));
    return `${appUrl()}/business/join/${invited.inviteToken}`;
  });
  refresh();
  return result.error ? { error: result.error } : { link: result.data };
}

export async function resendInvitationAction(id: string): Promise<{ link?: string; error?: string }> {
  const result = await businessAction("team.manage", async (ctx) => {
    const invited = await getOrganizationService().resendInvite(ctx.organization.id, id);
    return `${appUrl()}/business/join/${invited.inviteToken}`;
  });
  refresh();
  return result.error ? { error: result.error } : { link: result.data };
}

export async function updateMemberAction(id: string, values: unknown) {
  const result = await businessAction("team.manage", (ctx) =>
    getOrganizationService().updateMember(ctx, id, updateMemberSchema.parse(values)),
  );
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function removeMemberAction(id: string) {
  const result = await businessAction("team.manage", (ctx) => getOrganizationService().removeMember(ctx, id));
  refresh();
  return result.error ? { error: result.error } : {};
}
