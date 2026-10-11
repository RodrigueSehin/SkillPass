"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/actions/run";
import { PLANS } from "@/lib/business/plans";
import { ORG_ROLES, type OrgRole, type PlanCode } from "@/types/business";
import { getPlatformAdminService } from "@/services/container";
import { sanitizePermissions } from "@/lib/business/permissions";
import { ForbiddenError } from "@/lib/errors";

/** Every action goes through the service, which checks again that the caller is the SkillPass administrator. */
async function act(fn: (userId: string) => Promise<unknown>): Promise<ActionResult> {
  const result = await runAction(fn);
  if (!result.error) revalidatePath("/admin", "layout");
  return result;
}

export const verifyOrganizationAction = (id: string) =>
  act((userId) => getPlatformAdminService().verify(userId, String(id)));

export const rejectOrganizationAction = (id: string, reason: string) =>
  act((userId) => getPlatformAdminService().reject(userId, String(id), String(reason ?? "")));

export const reopenOrganizationAction = (id: string) =>
  act((userId) => getPlatformAdminService().reopen(userId, String(id)));

export const suspendOrganizationAction = (id: string) =>
  act((userId) => getPlatformAdminService().suspend(userId, String(id)));

export const reactivateOrganizationAction = (id: string) =>
  act((userId) => getPlatformAdminService().reactivate(userId, String(id)));

export const setOrganizationPlanAction = (id: string, plan: string) =>
  act((userId) => {
    if (!(plan in PLANS)) throw new ForbiddenError("Plan inconnu.");
    return getPlatformAdminService().setPlan(userId, String(id), plan as PlanCode);
  });

export const setOrganizationMaintenanceAction = (id: string, on: boolean) =>
  act((userId) => getPlatformAdminService().setMaintenance(userId, String(id), Boolean(on)));

export const updateMemberAccessAction = (
  orgId: string,
  memberId: string,
  input: { role?: string; permissions?: string[]; status?: string },
) =>
  act((userId) => {
    const role =
      input.role && (ORG_ROLES as readonly string[]).includes(input.role)
        ? (input.role as OrgRole)
        : undefined;
    const status = input.status === "ACTIVE" || input.status === "INACTIVE" ? input.status : undefined;
    const permissions = Array.isArray(input.permissions) ? sanitizePermissions(input.permissions) : undefined;
    return getPlatformAdminService().updateMember(userId, String(orgId), String(memberId), {
      role,
      permissions,
      status,
    });
  });

export const setProfilePlanAction = (profileId: string, plan: string) =>
  act((userId) => getPlatformAdminService().setTalentPlan(userId, String(profileId), String(plan)));

export const setProfileRoleAction = (profileId: string, role: string) =>
  act((userId) => getPlatformAdminService().setRole(userId, String(profileId), String(role)));
