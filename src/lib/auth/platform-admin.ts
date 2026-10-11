import { notFound } from "next/navigation";
import type { UserRole } from "@/types/profile";
import { requireUser } from "./current-user";
import { profileFor } from "./profile";

/** The general administrator of SkillPass: the only role allowed to change platform-level settings. */
export const isPlatformAdmin = (profile: { role: UserRole }) => profile.role === "SKILLPASS_ADMIN";

/**
 * Gate of the administration console. Anyone else gets a plain 404, so the console does not reveal that it
 * exists. The services check the role again on every call.
 */
export async function requirePlatformAdmin() {
  const user = await requireUser();
  const profile = await profileFor(user);
  if (!isPlatformAdmin(profile)) notFound();
  return { user, profile };
}
