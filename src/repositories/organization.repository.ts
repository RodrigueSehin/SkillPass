import type {
  DepartmentDTO,
  MemberDTO,
  MemberInvite,
  MemberTeam,
  OrganizationDTO,
  SiteDTO,
} from "@/types/business";

export type NewOrganization = Pick<OrganizationDTO, "name" | "slug"> &
  Partial<Pick<OrganizationDTO, "industry" | "size" | "website" | "description" | "plan" | "verified">>;

export type OrganizationPatch = Partial<
  Pick<
    OrganizationDTO,
    | "name"
    | "description"
    | "industry"
    | "size"
    | "website"
    | "address"
    | "phone"
    | "email"
    | "timezone"
    | "language"
  >
>;

export interface NewMember {
  profileId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  role: MemberDTO["role"];
  permissions: string[];
  status: MemberDTO["status"];
  siteId?: string | null;
  managerId?: string | null;
  invitationMessage?: string | null;
  inviteToken?: string | null;
  inviteExpiresAt?: string | null;
  invitedAt?: string | null;
  lastActiveAt?: string | null;
  teams: MemberTeam[];
}

export type MemberPatch = Partial<
  Pick<
    MemberDTO,
    | "firstName"
    | "lastName"
    | "phone"
    | "jobTitle"
    | "role"
    | "permissions"
    | "status"
    | "siteId"
    | "managerId"
  >
> & {
  teams?: MemberTeam[];
  inviteToken?: string | null;
  inviteExpiresAt?: string | null;
  invitedAt?: string | null;
};

export type DepartmentInput = Omit<DepartmentDTO, "id">;

/**
 * Everything about an organization lives behind one interface, and every method takes the organization id:
 * a caller can only reach rows of the organization it was authorized for.
 */
export interface OrganizationRepository {
  /** The organization a signed-in person belongs to (an active membership), with their member row. */
  findMembershipByProfile(
    profileId: string,
  ): Promise<{ organization: OrganizationDTO; member: MemberDTO } | null>;
  /** The invitation behind a link, whatever its state. */
  findInviteByToken(token: string): Promise<{ organization: OrganizationDTO; member: MemberInvite } | null>;
  slugTaken(slug: string): Promise<boolean>;
  createOrganization(
    org: NewOrganization,
    creator: NewMember,
  ): Promise<{ organization: OrganizationDTO; member: MemberDTO }>;
  getOrganization(id: string): Promise<OrganizationDTO | null>;
  updateOrganization(id: string, patch: OrganizationPatch): Promise<OrganizationDTO | null>;

  /** Stores (or clears, with null) the storage key of the logo. Returns the previous key. */
  setLogo(orgId: string, path: string | null): Promise<{ previousPath: string | null } | null>;
  getLogoPath(orgId: string): Promise<string | null>;

  listMembers(orgId: string): Promise<MemberDTO[]>;
  /** The same list with the invitation tokens, for the people allowed to share the links. */
  listInvites(orgId: string): Promise<MemberInvite[]>;
  getMember(orgId: string, id: string): Promise<MemberDTO | null>;
  emailTaken(orgId: string, email: string): Promise<boolean>;
  createMember(orgId: string, member: NewMember): Promise<MemberDTO>;
  updateMember(orgId: string, id: string, patch: MemberPatch): Promise<MemberDTO | null>;
  removeMember(orgId: string, id: string): Promise<boolean>;
  /** Atomic: links a pending, unexpired invitation to a profile and activates it. */
  acceptInvite(token: string, profileId: string, now: string): Promise<MemberDTO | null>;
  touchMember(orgId: string, id: string, now: string): Promise<void>;

  listSites(orgId: string): Promise<SiteDTO[]>;
  createSite(orgId: string, site: Omit<SiteDTO, "id">): Promise<SiteDTO>;
  updateSite(orgId: string, id: string, site: Omit<SiteDTO, "id">): Promise<SiteDTO | null>;
  deleteSite(orgId: string, id: string): Promise<boolean>;

  listDepartments(orgId: string): Promise<DepartmentDTO[]>;
  getDepartment(orgId: string, id: string): Promise<DepartmentDTO | null>;
  createDepartment(orgId: string, input: DepartmentInput): Promise<DepartmentDTO>;
  updateDepartment(orgId: string, id: string, input: DepartmentInput): Promise<DepartmentDTO | null>;
  deleteDepartment(orgId: string, id: string): Promise<boolean>;
}
