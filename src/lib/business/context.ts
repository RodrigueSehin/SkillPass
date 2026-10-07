import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { profileFor } from "@/lib/auth/profile";
import { can } from "@/lib/business/permissions";
import { getOrganizationService } from "@/services/container";
import type { OrgScope } from "@/services/organization.service";

export interface BusinessContext extends OrgScope {
  user: { id: string; email: string; name: string };
  /** True when the signed-in member holds the permission (an active administrator holds all of them). */
  can: (permission: string) => boolean;
}

/** The organization of the signed-in person, loaded once per request. Null when they have none. */
export const loadBusinessScope = cache(async (profileId: string) =>
  getOrganizationService().scopeFor(profileId),
);

/**
 * Server-side gate for every Business page and action. A person without an organization is sent to the
 * onboarding page; the scope returned here is the only source of the organization id used by the services.
 */
export async function requireBusiness(): Promise<BusinessContext> {
  const user = await requireUser();
  // Makes sure the profile row exists before any foreign key points at it.
  await profileFor(user);
  const scope = await loadBusinessScope(user.id);
  if (!scope) redirect("/business/onboarding");
  return { ...scope, user, can: (permission) => can(scope.member, permission) };
}
