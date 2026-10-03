import { describe, expect, it } from "vitest";
import { loginSchema, registerAccountSchema, registerGoalsSchema, registerProfileSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts a valid payload and trims the email", () => {
    const result = loginSchema.safeParse({ email: "  a@b.com ", password: "x" });
    expect(result.success && result.data.email).toBe("a@b.com");
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});

describe("registerAccountSchema", () => {
  const base = { fullName: "Sehin Rodrigue", email: "s@x.com" };

  it("requires an uppercase letter and a digit in the password", () => {
    expect(registerAccountSchema.safeParse({ ...base, password: "alllowercase1" }).success).toBe(false);
    expect(registerAccountSchema.safeParse({ ...base, password: "NoDigitsHere" }).success).toBe(false);
    expect(registerAccountSchema.safeParse({ ...base, password: "Valid1234" }).success).toBe(true);
  });
});

describe("registerProfileSchema", () => {
  it("coerces years of experience from form strings", () => {
    const result = registerProfileSchema.safeParse({
      profession: "Dev",
      location: "Abidjan",
      yearsOfExperience: "5",
    });
    expect(result.success && result.data.yearsOfExperience).toBe(5);
  });
});

describe("registerGoalsSchema", () => {
  it("rejects an unknown availability", () => {
    expect(
      registerGoalsSchema.safeParse({ mainSkills: "PA", careerGoal: "Lead", availability: "SOON" }).success,
    ).toBe(false);
  });
});
