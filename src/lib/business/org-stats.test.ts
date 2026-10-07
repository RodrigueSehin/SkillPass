import { describe, expect, it } from "vitest";
import type { DepartmentDTO, MemberDTO } from "@/types/business";
import {
  activeGrowth,
  activityLabel,
  roleDistribution,
  shortDate,
  siteHeadcount,
  teamDistribution,
} from "./org-stats";

const now = new Date("2026-10-07T10:30:00.000Z");
const DAY = 86_400_000;

const member = (id: string, over: Partial<MemberDTO> = {}): MemberDTO => ({
  id,
  profileId: null,
  firstName: id,
  lastName: "X",
  email: `${id}@x.com`,
  phone: null,
  jobTitle: null,
  role: "VIEWER",
  permissions: [],
  status: "ACTIVE",
  siteId: null,
  managerId: null,
  teams: [],
  invitationMessage: null,
  invitedAt: null,
  inviteExpiresAt: null,
  lastActiveAt: null,
  createdAt: new Date(now.getTime() - 90 * DAY).toISOString(),
  ...over,
});

const department = (id: string, name: string): DepartmentDTO => ({
  id,
  name,
  description: null,
  look: "users",
  parentId: null,
  mainSiteId: null,
  siteIds: [],
  objectives: [],
  status: "ACTIVE",
  accessLevel: "LIMITED",
  headId: null,
  deputies: [],
  replacementId: null,
  members: [],
});

describe("organization stats", () => {
  it("compares active members with a month ago", () => {
    const members = [
      member("a"),
      member("b"),
      member("c", { createdAt: new Date(now.getTime() - 5 * DAY).toISOString() }),
      member("d", { status: "INACTIVE" }),
      member("e", { status: "INVITED" }),
    ];
    expect(activeGrowth(members, now)).toEqual({ active: 3, deltaPercent: 50, newThisMonth: 1 });
    expect(activeGrowth([member("n", { createdAt: now.toISOString() })], now).deltaPercent).toBeNull();
  });

  it("counts roles among people who joined, and members per main team", () => {
    const members = [
      member("a", {
        role: "ADMIN",
        teams: [
          { departmentId: "hr", primary: true },
          { departmentId: "it", primary: false },
        ],
      }),
      member("b", { role: "ADMIN", teams: [{ departmentId: "hr", primary: true }] }),
      member("c", { role: "MANAGER", teams: [{ departmentId: "it", primary: true }] }),
      member("d", { role: "VIEWER", status: "INVITED", teams: [{ departmentId: "it", primary: true }] }),
    ];
    expect(roleDistribution(members).find((r) => r.role === "ADMIN")?.count).toBe(2);
    expect(roleDistribution(members).find((r) => r.role === "VIEWER")?.count).toBe(0);
    expect(
      teamDistribution(members, [department("hr", "RH"), department("it", "IT"), department("x", "Vide")]),
    ).toEqual([
      { id: "hr", name: "RH", count: 2 },
      { id: "it", name: "IT", count: 1 },
    ]);
  });

  it("counts the people of a site", () => {
    expect(
      siteHeadcount(
        [member("a", { siteId: "s" }), member("b", { siteId: "s", status: "INVITED" }), member("c")],
        "s",
      ),
    ).toBe(1);
  });

  it("words the last activity", () => {
    const at = (days: number, hh: number, mm: number) => {
      const d = new Date(Date.UTC(2026, 9, 7 - days, hh, mm));
      return d.toISOString();
    };
    expect(activityLabel(at(0, 8, 5), now)).toBe("Aujourd'hui 08:05");
    expect(activityLabel(at(1, 16, 45), now)).toBe("Hier 16:45");
    expect(activityLabel(at(5, 11, 20), now)).toBe("02 oct. 2026 11:20");
    expect(activityLabel(null, now)).toBe("Jamais");
  });

  it("formats a short date", () => {
    expect(shortDate("2026-10-01T09:00:00.000Z")).toBe("01/10/2026");
    expect(shortDate(null)).toBe("");
  });
});
