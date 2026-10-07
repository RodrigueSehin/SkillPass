import { ORG_ROLES, type DepartmentDTO, type MemberDTO, type OrgRole } from "@/types/business";

const DAY_MS = 86_400_000;

/** People who belong to the organization (invitations not accepted yet are not members). */
export const joined = (members: MemberDTO[]) => members.filter((m) => m.status !== "INVITED");
export const pending = (members: MemberDTO[]) => members.filter((m) => m.status === "INVITED");

/** Active members now, and how that compares with a month ago (null when there was nobody to compare to). */
export function activeGrowth(members: MemberDTO[], now = new Date()) {
  const active = members.filter((m) => m.status === "ACTIVE");
  const monthAgo = now.getTime() - 30 * DAY_MS;
  const before = active.filter((m) => Date.parse(m.createdAt) <= monthAgo).length;
  return {
    active: active.length,
    deltaPercent: before === 0 ? null : Math.round(((active.length - before) / before) * 100),
    newThisMonth: active.length - before,
  };
}

export function roleDistribution(members: MemberDTO[]) {
  const counts = new Map<OrgRole, number>();
  for (const m of joined(members)) counts.set(m.role, (counts.get(m.role) ?? 0) + 1);
  return ORG_ROLES.map((role) => ({ role, count: counts.get(role) ?? 0 }));
}

/** Members per main team, largest first. People without a team are not counted. */
export function teamDistribution(members: MemberDTO[], departments: DepartmentDTO[]) {
  const counts = new Map<string, number>();
  for (const m of joined(members)) {
    const main = m.teams.find((t) => t.primary) ?? m.teams[0];
    if (main) counts.set(main.departmentId, (counts.get(main.departmentId) ?? 0) + 1);
  }
  return departments
    .map((d) => ({ id: d.id, name: d.name, count: counts.get(d.id) ?? 0 }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
}

/** Number of members of a department, wherever it is their main team or not. */
export const departmentSize = (department: DepartmentDTO) => department.members.length;

/** Members attached to a site. */
export const siteHeadcount = (members: MemberDTO[], siteId: string) =>
  joined(members).filter((m) => m.siteId === siteId).length;

const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function parts(date: Date, timeZone: string) {
  const f = new Intl.DateTimeFormat("fr-FR", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(f.find((p) => p.type === type)?.value ?? 0);
  return {
    y: get("year"),
    m: get("month"),
    d: get("day"),
    hh: String(get("hour") % 24).padStart(2, "0"),
    mm: String(get("minute")).padStart(2, "0"),
  };
}

/** "Aujourd'hui 10:24", "Hier 16:45", "02 oct. 2026 11:20", or "Jamais" when the person never signed in. */
export function activityLabel(iso: string | null, now = new Date(), timeZone = "Africa/Abidjan") {
  if (!iso) return "Jamais";
  const at = new Date(iso);
  const a = parts(at, timeZone);
  const n = parts(now, timeZone);
  const day = (p: typeof a) => Date.UTC(p.y, p.m - 1, p.d);
  const diff = Math.round((day(n) - day(a)) / DAY_MS);
  const time = `${a.hh}:${a.mm}`;
  if (diff === 0) return `Aujourd'hui ${time}`;
  if (diff === 1) return `Hier ${time}`;
  return `${String(a.d).padStart(2, "0")} ${MONTHS[a.m - 1]} ${a.y} ${time}`;
}

/** "01/10/2026". */
export function shortDate(iso: string | null, timeZone = "Africa/Abidjan") {
  if (!iso) return "";
  const p = parts(new Date(iso), timeZone);
  return `${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")}/${p.y}`;
}

/** "AGL Côte d'Ivoire" → "AGL"; "Banque Atlantique" → "BA". A short upper-case first word is the brand. */
export function orgInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const first = words[0] ?? "";
  if (first.length >= 2 && first.length <= 4 && first === first.toUpperCase() && /^[A-ZÀ-Ý0-9]+$/.test(first))
    return first;
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
