import { describe, expect, it } from "vitest";
import { normalizeSupabaseUrl } from "./env";

describe("normalizeSupabaseUrl", () => {
  it("keeps a clean project URL", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co")).toBe("https://abc.supabase.co");
  });

  it("strips the /rest/v1/ suffix shown in the dashboard", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co/rest/v1/")).toBe("https://abc.supabase.co");
  });

  it("strips trailing slashes, extra paths and whitespace", () => {
    expect(normalizeSupabaseUrl("  https://abc.supabase.co/  ")).toBe("https://abc.supabase.co");
    expect(normalizeSupabaseUrl("https://abc.supabase.co/auth/v1")).toBe("https://abc.supabase.co");
  });

  it("returns an empty string when unset and the raw value when unparsable", () => {
    expect(normalizeSupabaseUrl(undefined)).toBe("");
    expect(normalizeSupabaseUrl("not a url")).toBe("not a url");
  });
});
