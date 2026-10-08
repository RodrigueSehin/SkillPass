"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireBusiness } from "@/lib/business/context";
import { businessAction } from "@/lib/business/action";
import { AppError, ForbiddenError } from "@/lib/errors";
import {
  brandingSchema,
  complianceSchema,
  maintenanceSchema,
  notificationsSchema,
} from "@/schemas/org-settings";
import { getOrganizationLifecycleService, getOrganizationService } from "@/services/container";

const refresh = () => revalidatePath("/business", "layout");
const ADMIN_ONLY = "Seul un administrateur peut effectuer cette action.";

export async function saveBrandingAction(values: unknown) {
  const result = await businessAction("org.manage", (ctx) =>
    getOrganizationService().saveSettings(ctx.organization.id, { branding: brandingSchema.parse(values) }),
  );
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function saveNotificationsAction(values: unknown) {
  const result = await businessAction("org.manage", (ctx) =>
    getOrganizationService().saveSettings(ctx.organization.id, {
      notifications: notificationsSchema.parse(values),
    }),
  );
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function saveComplianceAction(values: unknown) {
  const result = await businessAction("org.manage", (ctx) =>
    getOrganizationService().saveSettings(ctx.organization.id, {
      compliance: complianceSchema.parse(values),
    }),
  );
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function setMaintenanceAction(values: unknown) {
  const result = await businessAction("org.manage", (ctx) =>
    getOrganizationService().saveSettings(ctx.organization.id, {
      maintenance: maintenanceSchema.parse(values).maintenance,
    }),
  );
  refresh();
  return result.error ? { error: result.error } : {};
}

/** Suspends the organization: nobody can use it until an administrator reactivates it. */
export async function deactivateOrganizationAction() {
  const result = await businessAction("org.manage", async (ctx) => {
    if (ctx.member.role !== "ADMIN") throw new ForbiddenError(ADMIN_ONLY);
    await getOrganizationLifecycleService().suspend(ctx);
  });
  refresh();
  return result.error ? { error: result.error } : {};
}

/** Runs while the organization is suspended, so it cannot go through `businessAction`. */
export async function reactivateOrganizationAction(): Promise<{ error?: string }> {
  const ctx = await requireBusiness({ allowSuspended: true });
  try {
    if (ctx.member.role !== "ADMIN" || ctx.member.status !== "ACTIVE") throw new ForbiddenError(ADMIN_ONLY);
    await getOrganizationLifecycleService().resume(ctx);
    refresh();
    return {};
  } catch (err) {
    if (err instanceof AppError) return { error: err.message };
    console.error("reactivation failed", err);
    return { error: "Une erreur est survenue. Veuillez réessayer." };
  }
}

export async function leaveOrganizationAction() {
  const result = await businessAction(null, (ctx) => getOrganizationService().leave(ctx));
  refresh();
  return result.error ? { error: result.error } : {};
}

export async function deleteOrganizationAction(typedName: unknown) {
  const result = await businessAction("org.manage", async (ctx) => {
    if (ctx.member.role !== "ADMIN") throw new ForbiddenError(ADMIN_ONLY);
    if (typeof typedName !== "string") throw new ZodError([]);
    await getOrganizationLifecycleService().deleteOrganization(ctx, typedName);
  });
  refresh();
  return result.error ? { error: result.error } : {};
}
