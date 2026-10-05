import { describe, expect, it } from "vitest";
import type { CertificationDTO } from "@/types/portfolio";
import {
  certificationState,
  certificationStats,
  daysUntilExpiry,
  filterCertifications,
} from "./certification-status";

const today = "2026-10-05";
const cert = (id: string, over: Partial<CertificationDTO>): CertificationDTO => ({
  id,
  name: id,
  issuer: "Microsoft",
  issueDate: "2025-01-01",
  expirationDate: null,
  credentialId: null,
  credentialUrl: null,
  verificationStatus: "UNVERIFIED",
  ...over,
});

const items = [
  cert("forever", {}),
  cert("far", { expirationDate: "2028-01-01", issueDate: "2026-02-01" }),
  cert("soon", { expirationDate: "2026-11-01", issuer: "AWS", verificationStatus: "VERIFIED" }),
  cert("lapsed", { expirationDate: "2026-10-04" }),
  cert("today", { expirationDate: today }),
];
const ids = (r: CertificationDTO[]) => r.map((c) => c.id);

describe("certification state", () => {
  it("counts days and handles no expiry", () => {
    expect(daysUntilExpiry({ expirationDate: "2026-10-15" }, today)).toBe(10);
    expect(daysUntilExpiry({ expirationDate: null }, today)).toBeNull();
  });
  it("is expired only after the expiry day", () => {
    expect(certificationState({ expirationDate: "2026-10-04" }, today)).toBe("EXPIRED");
    expect(certificationState({ expirationDate: today }, today)).toBe("EXPIRING");
  });
  it("flags the 90-day window", () => {
    expect(certificationState({ expirationDate: "2027-01-03" }, today)).toBe("EXPIRING");
    expect(certificationState({ expirationDate: "2027-01-04" }, today)).toBe("ACTIVE");
  });
});

describe("filterCertifications", () => {
  it("tabs", () => {
    expect(ids(filterCertifications(items, { tab: "expired" }, today))).toEqual(["lapsed"]);
    expect(ids(filterCertifications(items, { tab: "expiring" }, today)).sort()).toEqual(["soon", "today"]);
    expect(ids(filterCertifications(items, { tab: "obtained" }, today))).not.toContain("lapsed");
  });
  it("issuer, verification and search; unknown values are ignored", () => {
    expect(ids(filterCertifications(items, { issuer: "AWS" }, today))).toEqual(["soon"]);
    expect(ids(filterCertifications(items, { verification: "VERIFIED" }, today))).toEqual(["soon"]);
    expect(ids(filterCertifications(items, { q: "FAR" }, today))).toEqual(["far"]);
    expect(
      filterCertifications(items, { verification: "bogus", tab: "nope", sort: "?" }, today),
    ).toHaveLength(5);
  });
  it("sorts by expiry with never-expiring last", () => {
    const sorted = ids(filterCertifications(items, { sort: "expiry" }, today));
    expect(sorted[0]).toBe("lapsed");
    expect(sorted.at(-1)).toBe("forever");
  });
});

describe("certificationStats", () => {
  it("summarises", () => {
    expect(certificationStats(items, today)).toEqual({
      total: 5,
      active: 2,
      expiring: 2,
      expired: 1,
      issuedThisYear: 1,
    });
  });
});
