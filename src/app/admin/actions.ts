"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/actions/run";
import { PLANS } from "@/lib/business/plans";
import { ORG_ROLES, type OrgRole, type PlanCode } from "@/types/business";
import { getPlatformAdminService } from "@/services/container";
import { sanitizePermissions } from "@/lib/business/permissions";
import { ForbiddenError } from "@/lib/errors";

/**
 * Every action goes through the service, which checks again that the caller is the SkillPass administrator.
 * A "use server" file may only export async functions: no arrow constants.
 */
async function act(fn: (userId: string) => Promise<unknown>): Promise<ActionResult> {
  const result = await runAction(fn);
  if (!result.error) revalidatePath("/admin", "layout");
  return result;
}

export async function verifyOrganizationAction(id: string): Promise<ActionResult> {
  return act((userId) => getPlatformAdminService().verify(userId, String(id)));
}

export async function rejectOrganizationAction(id: string, reason: string): Promise<ActionResult> {
  return act((userId) => getPlatformAdminService().reject(userId, String(id), String(reason ?? "")));
}

export async function reopenOrganizationAction(id: string): Promise<ActionResult> {
  return act((userId) => getPlatformAdminService().reopen(userId, String(id)));
}

export async function suspendOrganizationAction(id: string): Promise<ActionResult> {
  return act((userId) => getPlatformAdminService().suspend(userId, String(id)));
}

export async function reactivateOrganizationAction(id: string): Promise<ActionResult> {
  return act((userId) => getPlatformAdminService().reactivate(userId, String(id)));
}

export async function setOrganizationPlanAction(id: string, plan: string): Promise<ActionResult> {
  return act((userId) => {
    if (!(plan in PLANS)) throw new ForbiddenError("Plan inconnu.");
    return getPlatformAdminService().setPlan(userId, String(id), plan as PlanCode);
  });
}

export async function setOrganizationMaintenanceAction(id: string, on: boolean): Promise<ActionResult> {
  return act((userId) => getPlatformAdminService().setMaintenance(userId, String(id), Boolean(on)));
}

export async function updateMemberAccessAction(
  orgId: string,
  memberId: string,
  input: { role?: string; permissions?: string[]; status?: string },
): Promise<ActionResult> {
  return act((userId) => {
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
}

export async function setProfilePlanAction(profileId: string, plan: string): Promise<ActionResult> {
  return act((userId) => getPlatformAdminService().setTalentPlan(userId, String(profileId), String(plan)));
}

export async function setProfileRoleAction(profileId: string, role: string): Promise<ActionResult> {
  return act((userId) => getPlatformAdminService().setRole(userId, String(profileId), String(role)));
}
