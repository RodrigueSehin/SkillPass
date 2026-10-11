import { describe, expect, it } from "vitest";
import { registerCompanySchema } from "./auth";

const valid = {
  fullName: "Serge Bamba",
  email: "serge@agl-ci.com",
  password: "Motdepasse1",
  organization: "AGL Côte d'Ivoire",
};

describe("registerCompanySchema", () => {
  it("accepts the minimum: contact, login and organization name", () => {
    expect(registerCompanySchema.safeParse(valid).success).toBe(true);
    expect(registerCompanySchema.safeParse({ ...valid, website: "https://www.agl-ci.com" }).success).toBe(
      true,
    );
  });

  it("rejects a weak password, a missing organization and a bad site address", () => {
    expect(registerCompanySchema.safeParse({ ...valid, password: "faible" }).success).toBe(false);
    expect(registerCompanySchema.safeParse({ ...valid, organization: "A" }).success).toBe(false);
    expect(registerCompanySchema.safeParse({ ...valid, website: "javascript:alert(1)" }).success).toBe(false);
    expect(registerCompanySchema.safeParse({ ...valid, email: "pas-un-mail" }).success).toBe(false);
  });
});
