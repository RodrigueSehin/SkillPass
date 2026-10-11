import type {
  AuditEntryDTO,
  AuditEntryInput,
  OrgAdminDetail,
  OrgAdminRow,
  PlatformStats,
  ProfileAdminRow,
} from "@/types/platform";
import type { UserRole } from "@/types/profile";

/** Everything the SkillPass administrator sees across all organizations and accounts. */
export interface PlatformRepository {
  /** `since` (ISO) marks the start of the "new accounts" window. */
  stats(since: string): Promise<PlatformStats>;
  listOrganizations(): Promise<OrgAdminRow[]>;
  getOrganization(id: string): Promise<OrgAdminDetail | null>;
  listProfiles(limit: number): Promise<ProfileAdminRow[]>;
  getProfile(id: string): Promise<ProfileAdminRow | null>;
  setProfileRole(id: string, role: UserRole): Promise<ProfileAdminRow | null>;
  countProfilesWithRole(role: UserRole): Promise<number>;

  addAudit(entry: AuditEntryInput): Promise<AuditEntryDTO>;
  listAudit(limit: number): Promise<AuditEntryDTO[]>;
}
