import type { UserRole } from "@/types/profile";

/** The general administrator of SkillPass: the only role allowed to change platform-level settings. */
export const isPlatformAdmin = (profile: { role: UserRole }) => profile.role === "SKILLPASS_ADMIN";
