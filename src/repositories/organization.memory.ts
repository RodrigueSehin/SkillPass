import { createHash, randomUUID } from "node:crypto";
import { ROLE_PRESETS } from "@/lib/business/permissions";
import type {
  DepartmentDTO,
  MemberDTO,
  MemberInvite,
  OrganizationDTO,
  OrgRole,
  SiteDTO,
} from "@/types/business";
import type {
  DepartmentInput,
  MemberPatch,
  NewMember,
  NewOrganization,
  OrganizationPatch,
  OrganizationRepository,
} from "./organization.repository";

interface Row {
  departmentId: string;
  memberId: string;
  primary: boolean;
  role: string;
}

type StoredMember = Omit<MemberInvite, "teams"> & { orgId: string };
type StoredSite = SiteDTO & { orgId: string };
type StoredDepartment = Omit<DepartmentDTO, "members"> & { orgId: string };

const DAY_MS = 86_400_000;

/** In-memory organizations for tests and for previews without a database. */
export class InMemoryOrganizationRepository implements OrganizationRepository {
  private orgs = new Map<string, OrganizationDTO>();
  private members: StoredMember[] = [];
  private sites: StoredSite[] = [];
  private departments: StoredDepartment[] = [];
  private rows: Row[] = [];
  private logos = new Map<string, string>();

  /** `demoProfileId` gets a ready-made organization, so every screen has something to show. */
  constructor(demoProfileId?: string, now = new Date()) {
    if (demoProfileId) this.seedDemo(demoProfileId, now);
  }

  // ---------------------------------------------------------------- views

  private orgView(org: OrganizationDTO): OrganizationDTO {
    const path = this.logos.get(org.id);
    return { ...org, logoVersion: path ? createHash("sha1").update(path).digest("hex").slice(0, 8) : null };
  }

  private memberView({ orgId, inviteToken, ...m }: StoredMember): MemberDTO {
    void orgId;
    void inviteToken;
    return {
      ...m,
      permissions: [...m.permissions],
      teams: this.rows
        .filter((r) => r.memberId === m.id)
        .map((r) => ({ departmentId: r.departmentId, primary: r.primary })),
    };
  }

  private inviteView(m: StoredMember): MemberInvite {
    return { ...this.memberView(m), inviteToken: m.inviteToken };
  }

  private departmentView({ orgId, ...d }: StoredDepartment): DepartmentDTO {
    void orgId;
    return {
      ...d,
      siteIds: [...d.siteIds],
      objectives: [...d.objectives],
      deputies: d.deputies.map((x) => ({ ...x })),
      members: this.rows
        .filter((r) => r.departmentId === d.id)
        .map((r) => ({ memberId: r.memberId, role: r.role })),
    };
  }

  // ---------------------------------------------------------------- organizations

  async findMembershipByProfile(profileId: string) {
    const member = this.members.find((m) => m.profileId === profileId && m.status !== "INVITED");
    const org = member && this.orgs.get(member.orgId);
    return member && org ? { organization: this.orgView(org), member: this.memberView(member) } : null;
  }

  async findInviteByToken(token: string) {
    const member = this.members.find((m) => m.inviteToken === token);
    const org = member && this.orgs.get(member.orgId);
    return member && org ? { organization: this.orgView(org), member: this.inviteView(member) } : null;
  }

  async slugTaken(slug: string) {
    return [...this.orgs.values()].some((o) => o.slug === slug);
  }

  async createOrganization(input: NewOrganization, creator: NewMember) {
    const organization: OrganizationDTO = {
      id: randomUUID(),
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      industry: input.industry ?? null,
      size: input.size ?? null,
      website: input.website ?? null,
      address: null,
      phone: null,
      email: null,
      timezone: "Africa/Abidjan",
      language: "fr",
      verified: input.verified ?? false,
      plan: input.plan ?? "BUSINESS",
      logoVersion: null,
      createdAt: new Date().toISOString(),
    };
    this.orgs.set(organization.id, organization);
    const member = await this.createMember(organization.id, creator);
    return { organization: this.orgView(organization), member };
  }

  async getOrganization(id: string) {
    const org = this.orgs.get(id);
    return org ? this.orgView(org) : null;
  }

  async setLogo(orgId: string, path: string | null) {
    if (!this.orgs.has(orgId)) return null;
    const previousPath = this.logos.get(orgId) ?? null;
    if (path) this.logos.set(orgId, path);
    else this.logos.delete(orgId);
    return { previousPath };
  }

  async getLogoPath(orgId: string) {
    return this.logos.get(orgId) ?? null;
  }

  async updateOrganization(id: string, patch: OrganizationPatch) {
    const org = this.orgs.get(id);
    if (!org) return null;
    Object.assign(org, patch);
    return this.orgView(org);
  }

  // ---------------------------------------------------------------- members

  async listMembers(orgId: string) {
    return this.members.filter((m) => m.orgId === orgId).map((m) => this.memberView(m));
  }

  async listInvites(orgId: string) {
    return this.members.filter((m) => m.orgId === orgId).map((m) => this.inviteView(m));
  }

  async getMember(orgId: string, id: string) {
    const m = this.members.find((x) => x.orgId === orgId && x.id === id);
    return m ? this.memberView(m) : null;
  }

  async emailTaken(orgId: string, email: string) {
    return this.members.some((m) => m.orgId === orgId && m.email.toLowerCase() === email.toLowerCase());
  }

  private writeTeams(memberId: string, teams: { departmentId: string; primary: boolean }[]) {
    this.rows = this.rows.filter((r) => r.memberId !== memberId);
    for (const t of teams) {
      this.rows.push({ departmentId: t.departmentId, memberId, primary: t.primary, role: "Membre" });
    }
  }

  async createMember(orgId: string, input: NewMember) {
    const member: StoredMember = {
      id: randomUUID(),
      orgId,
      profileId: input.profileId ?? null,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      jobTitle: input.jobTitle ?? null,
      role: input.role,
      permissions: [...input.permissions],
      status: input.status,
      siteId: input.siteId ?? null,
      managerId: input.managerId ?? null,
      invitationMessage: input.invitationMessage ?? null,
      inviteToken: input.inviteToken ?? null,
      inviteExpiresAt: input.inviteExpiresAt ?? null,
      invitedAt: input.invitedAt ?? null,
      lastActiveAt: input.lastActiveAt ?? null,
      createdAt: new Date().toISOString(),
    };
    this.members.push(member);
    this.writeTeams(member.id, input.teams);
    return this.memberView(member);
  }

  async updateMember(orgId: string, id: string, patch: MemberPatch) {
    const member = this.members.find((m) => m.orgId === orgId && m.id === id);
    if (!member) return null;
    const { teams, ...fields } = patch;
    Object.assign(member, fields);
    if (teams) this.writeTeams(id, teams);
    return this.memberView(member);
  }

  async removeMember(orgId: string, id: string) {
    const index = this.members.findIndex((m) => m.orgId === orgId && m.id === id);
    if (index === -1) return false;
    this.members.splice(index, 1);
    this.rows = this.rows.filter((r) => r.memberId !== id);
    for (const m of this.members) if (m.managerId === id) m.managerId = null;
    for (const d of this.departments) {
      if (d.headId === id) d.headId = null;
      if (d.replacementId === id) d.replacementId = null;
      d.deputies = d.deputies.filter((x) => x.memberId !== id);
    }
    return true;
  }

  async acceptInvite(token: string, profileId: string, now: string) {
    const member = this.members.find((m) => m.inviteToken === token);
    if (!member || member.status !== "INVITED") return null;
    if (member.inviteExpiresAt && member.inviteExpiresAt <= now) return null;
    // A person belongs to one organization at a time.
    if (this.members.some((m) => m.profileId === profileId && m.status !== "INVITED")) return null;
    Object.assign(member, { profileId, status: "ACTIVE", inviteToken: null, lastActiveAt: now });
    return this.memberView(member);
  }

  async touchMember(orgId: string, id: string, now: string) {
    const member = this.members.find((m) => m.orgId === orgId && m.id === id);
    if (member) member.lastActiveAt = now;
  }

  // ---------------------------------------------------------------- sites

  async listSites(orgId: string) {
    return this.sites.filter((s) => s.orgId === orgId).map(({ orgId: _o, ...s }) => (void _o, { ...s }));
  }

  async createSite(orgId: string, site: Omit<SiteDTO, "id">) {
    const stored = { id: randomUUID(), orgId, name: site.name, address: site.address };
    this.sites.push(stored);
    return { id: stored.id, name: stored.name, address: stored.address };
  }

  async updateSite(orgId: string, id: string, site: Omit<SiteDTO, "id">) {
    const stored = this.sites.find((s) => s.orgId === orgId && s.id === id);
    if (!stored) return null;
    Object.assign(stored, site);
    return { id, name: stored.name, address: stored.address };
  }

  async deleteSite(orgId: string, id: string) {
    const index = this.sites.findIndex((s) => s.orgId === orgId && s.id === id);
    if (index === -1) return false;
    this.sites.splice(index, 1);
    for (const m of this.members) if (m.siteId === id) m.siteId = null;
    for (const d of this.departments) {
      if (d.mainSiteId === id) d.mainSiteId = null;
      d.siteIds = d.siteIds.filter((s) => s !== id);
    }
    return true;
  }

  // ---------------------------------------------------------------- departments

  async listDepartments(orgId: string) {
    return this.departments.filter((d) => d.orgId === orgId).map((d) => this.departmentView(d));
  }

  async getDepartment(orgId: string, id: string) {
    const d = this.departments.find((x) => x.orgId === orgId && x.id === id);
    return d ? this.departmentView(d) : null;
  }

  private writeDepartmentMembers(departmentId: string, members: { memberId: string; role: string }[]) {
    const previous = this.rows.filter((r) => r.departmentId === departmentId);
    this.rows = this.rows.filter((r) => r.departmentId !== departmentId);
    for (const m of members) {
      const had = previous.find((r) => r.memberId === m.memberId);
      // A person's first team becomes their main one.
      const hasPrimary = this.rows.some((r) => r.memberId === m.memberId && r.primary);
      this.rows.push({
        departmentId,
        memberId: m.memberId,
        role: m.role,
        primary: had ? had.primary : !hasPrimary,
      });
    }
  }

  async createDepartment(orgId: string, input: DepartmentInput) {
    const { members, ...fields } = input;
    const stored: StoredDepartment = { id: randomUUID(), orgId, ...fields };
    this.departments.push(stored);
    this.writeDepartmentMembers(stored.id, members);
    return this.departmentView(stored);
  }

  async updateDepartment(orgId: string, id: string, input: DepartmentInput) {
    const stored = this.departments.find((d) => d.orgId === orgId && d.id === id);
    if (!stored) return null;
    const { members, ...fields } = input;
    Object.assign(stored, fields);
    this.writeDepartmentMembers(id, members);
    return this.departmentView(stored);
  }

  async deleteDepartment(orgId: string, id: string) {
    const index = this.departments.findIndex((d) => d.orgId === orgId && d.id === id);
    if (index === -1) return false;
    this.departments.splice(index, 1);
    this.rows = this.rows.filter((r) => r.departmentId !== id);
    for (const d of this.departments) if (d.parentId === id) d.parentId = null;
    return true;
  }

  // ---------------------------------------------------------------- demo data

  private seedDemo(profileId: string, now: Date) {
    const ago = (days: number, hours = 0) =>
      new Date(now.getTime() - days * DAY_MS - hours * 3_600_000).toISOString();
    const orgId = randomUUID();
    this.orgs.set(orgId, {
      id: orgId,
      name: "AGL Côte d'Ivoire",
      slug: "agl-cote-d-ivoire",
      description:
        "Acteur majeur de la logistique et du transport en Afrique. Nous connectons les marchés, facilitons les échanges et créons des opportunités de croissance durable.",
      industry: "Logistique & Transport",
      size: "501 - 1 000 employés",
      website: "https://www.aglgroup.com",
      address: "Riviera Palmeraie, Abidjan, Côte d'Ivoire",
      phone: "+225 27 22 00 00 00",
      email: "contact-ci@aglgroup.com",
      timezone: "Africa/Abidjan",
      language: "fr",
      verified: true,
      plan: "BUSINESS",
      logoVersion: null,
      createdAt: ago(700),
    });

    const [hq, port, terminal] = [randomUUID(), randomUUID(), randomUUID()];
    this.sites.push(
      { id: hq, orgId, name: "Siège - Abidjan", address: "Riviera Palmeraie, Abidjan" },
      { id: port, orgId, name: "Port Autonome", address: "Treichville, Abidjan" },
      { id: terminal, orgId, name: "Terminal Vridi", address: "Port de Vridi, Abidjan" },
    );

    const dept = (name: string, look: DepartmentDTO["look"], description: string, siteId: string) => {
      const d: StoredDepartment = {
        id: randomUUID(),
        orgId,
        name,
        description,
        look,
        parentId: null,
        mainSiteId: siteId,
        siteIds: [siteId],
        objectives: [],
        status: "ACTIVE",
        accessLevel: "LIMITED",
        headId: null,
        deputies: [],
        replacementId: null,
      };
      this.departments.push(d);
      return d;
    };
    const hr = dept(
      "Ressources Humaines",
      "users",
      "Gestion des talents, recrutement et développement des compétences.",
      hq,
    );
    const direction = dept("Direction", "settings", "Pilotage stratégique et gouvernance.", hq);
    const ops = dept("Opérations", "truck", "Exploitation et opérations terrain.", port);
    const sales = dept("Commercial", "chart", "Développement commercial et relations clients.", hq);
    const it = dept("IT", "monitor", "Systèmes d'information et infrastructures.", terminal);
    const finance = dept("Finance", "coins", "Gestion financière et contrôle.", hq);
    for (const d of [hr, ops, sales, it, finance]) d.parentId = direction.id;

    const person = (
      first: string,
      last: string,
      role: OrgRole,
      team: StoredDepartment,
      jobTitle: string,
      status: MemberDTO["status"],
      activity: string | null,
      siteId: string,
      profile: string | null = null,
    ) => {
      const m: StoredMember = {
        id: randomUUID(),
        orgId,
        profileId: profile,
        firstName: first,
        lastName: last,
        email:
          `${first}.${last}`
            .toLowerCase()
            .normalize("NFD")
            .replace(/[^a-z.]/g, "") + "@agl-ci.com",
        phone: null,
        jobTitle,
        role,
        permissions: [...ROLE_PRESETS[role]],
        status,
        siteId,
        managerId: null,
        invitationMessage: null,
        inviteToken: null,
        inviteExpiresAt: null,
        invitedAt: ago(40),
        lastActiveAt: activity,
        createdAt: ago(60),
      };
      this.members.push(m);
      this.rows.push({ departmentId: team.id, memberId: m.id, primary: true, role: "Membre" });
      return m;
    };

    const jm = person(
      "Jean-Marc",
      "Kouakou",
      "ADMIN",
      direction,
      "Directeur général",
      "ACTIVE",
      ago(0, 1),
      hq,
      profileId,
    );
    const aminata = person("Aminata", "Traoré", "RECRUITER", hr, "Chargée RH", "ACTIVE", ago(1, 0), hq);
    const koffi = person(
      "Koffi",
      "Yao",
      "MANAGER",
      ops,
      "Responsable des opérations",
      "ACTIVE",
      ago(1, 3),
      port,
    );
    const clarisse = person(
      "Clarisse",
      "Dembélé",
      "RECRUITER",
      sales,
      "Chargée de recrutement",
      "ACTIVE",
      ago(4),
      hq,
    );
    const ibrahim = person(
      "Ibrahim",
      "Diarra",
      "EVALUATOR",
      it,
      "Ingénieur systèmes",
      "ACTIVE",
      ago(4, 2),
      terminal,
    );
    const nathalie = person("Nathalie", "Koné", "MANAGER", hr, "Responsable RH", "ACTIVE", ago(5), hq);
    const serge = person(
      "Serge",
      "Bamba",
      "EVALUATOR",
      finance,
      "Contrôleur de gestion",
      "INACTIVE",
      ago(9),
      hq,
    );
    const ruth = person(
      "Ruth",
      "Adjoua",
      "RECRUITER",
      sales,
      "Chargée de recrutement",
      "ACTIVE",
      ago(9, 5),
      hq,
    );
    person("Mariam", "Touré", "ADMIN", direction, "Directrice administrative", "ACTIVE", ago(2), hq);
    person("Yves", "Kouadio", "RECRUITER", hr, "Chargé de recrutement", "ACTIVE", ago(3), hq);
    person("Fatoumata", "Diallo", "MANAGER", sales, "Responsable commerciale", "ACTIVE", ago(6), hq);
    person("Paul", "Anoh", "VIEWER", it, "Technicien support", "ACTIVE", ago(7), terminal);

    for (const m of this.members) if (m.id !== jm.id && m.role !== "ADMIN") m.managerId = jm.id;
    hr.headId = aminata.id;
    direction.headId = koffi.id;
    ops.headId = koffi.id;
    sales.headId = clarisse.id;
    it.headId = ibrahim.id;
    finance.headId = serge.id;
    hr.deputies = [{ memberId: nathalie.id, level: "PRINCIPAL" }];
    sales.deputies = [{ memberId: ruth.id, level: "DEPUTY" }];
    hr.replacementId = serge.id;

    const invite = (first: string, last: string, role: OrgRole, daysAgo: number, expired = false) => {
      const m = person(first, last, role, hr, "", "INVITED", null, hq);
      this.rows = this.rows.filter((r) => r.memberId !== m.id);
      Object.assign(m, {
        jobTitle: null,
        createdAt: ago(daysAgo),
        invitedAt: ago(daysAgo),
        inviteToken: randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, ""),
        inviteExpiresAt: new Date(now.getTime() + (expired ? -1 : 1) * 7 * DAY_MS).toISOString(),
      });
    };
    invite("Kouamé", "Marc", "RECRUITER", 6);
    invite("Sophie", "Bédié", "EVALUATOR", 7);
    invite("Christian", "Loua", "MANAGER", 9);
    invite("Adèle", "N'Dri", "VIEWER", 10);
    invite("Moussa", "Sangaré", "RECRUITER", 11);
  }
}
