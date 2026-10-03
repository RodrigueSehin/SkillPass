import { describe, expect, it } from "vitest";
import { isRemembered, withRememberPolicy } from "./remember";

describe("isRemembered", () => {
  it("remembers by default and only forgets on an explicit 0", () => {
    expect(isRemembered(undefined)).toBe(true);
    expect(isRemembered("1")).toBe(true);
    expect(isRemembered("0")).toBe(false);
  });
});

describe("withRememberPolicy", () => {
  const persistent = {
    path: "/",
    maxAge: 34_560_000,
    expires: new Date("2030-01-01"),
    sameSite: "lax" as const,
  };

  it("keeps the cookie persistent when the visitor asked to be remembered", () => {
    expect(withRememberPolicy("sb-abc-auth-token", "v", persistent, true)).toBe(persistent);
  });

  it("turns Supabase session cookies into browser-session cookies otherwise", () => {
    const result = withRememberPolicy("sb-abc-auth-token", "v", persistent, false);
    expect(result).toEqual({ path: "/", sameSite: "lax" });
    expect(result).not.toHaveProperty("maxAge");
    expect(result).not.toHaveProperty("expires");
  });

  it("never touches deletions, so sign-out still clears the cookies", () => {
    const deletion = { path: "/", maxAge: 0 };
    expect(withRememberPolicy("sb-abc-auth-token", "", deletion, false)).toBe(deletion);
    expect(withRememberPolicy("sb-abc-auth-token", "x", deletion, false)).toBe(deletion);
  });

  it("ignores cookies that are not Supabase's", () => {
    expect(withRememberPolicy("theme", "dark", persistent, false)).toBe(persistent);
  });

  it("passes through missing options", () => {
    expect(withRememberPolicy("sb-abc-auth-token", "v", undefined, false)).toBeUndefined();
  });
});
