import { memberName, type DepartmentDTO, type MemberDTO } from "@/types/business";

export interface MemberFilters {
  q?: string;
  team?: string;
  role?: string;
  status?: string;
}

export const MEMBERS_PER_PAGE = 8;

/** Members first (most recently active on top), invitations not accepted yet last. */
export function filterMembers(all: MemberDTO[], f: MemberFilters, departments: DepartmentDTO[] = []) {
  const q = f.q?.trim().toLowerCase();
  const teamName = (m: MemberDTO) => {
    const main = m.teams.find((t) => t.primary) ?? m.teams[0];
    return departments.find((d) => d.id === main?.departmentId)?.name;
  };
  return all
    .filter(
      (m) =>
        (!q || [memberName(m), m.email, m.jobTitle, teamName(m)].some((t) => t?.toLowerCase().includes(q))) &&
        (!f.team || m.teams.some((t) => t.departmentId === f.team)) &&
        (!f.role || m.role === f.role) &&
        (!f.status || m.status === f.status),
    )
    .sort(
      (a, b) =>
        Number(a.status === "INVITED") - Number(b.status === "INVITED") ||
        (b.lastActiveAt ?? "").localeCompare(a.lastActiveAt ?? "") ||
        memberName(a).localeCompare(memberName(b), "fr"),
    );
}

/** Seats in use: everyone in the organization, invitations included. */
export const seatsUsed = (members: MemberDTO[]) => members.length;
