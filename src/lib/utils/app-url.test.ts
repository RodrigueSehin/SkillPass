import { describe, expect, it } from "vitest";
import { appUrl, isLocalUrl } from "./app-url";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe("appUrl", () => {
  it("uses the configured site in production", () => {
    expect(
      appUrl(env({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "https://skillpass.example.com/" })),
    ).toBe("https://skillpass.example.com");
  });

  it("ignores a localhost value in production and falls back to Vercel's address", () => {
    expect(
      appUrl(
        env({
          NODE_ENV: "production",
          NEXT_PUBLIC_APP_URL: "http://localhost:3000",
          VERCEL_PROJECT_PRODUCTION_URL: "skillpass-three.vercel.app",
        }),
      ),
    ).toBe("https://skillpass-three.vercel.app");
    expect(appUrl(env({ NODE_ENV: "production", VERCEL_URL: "skillpass-git-main.vercel.app" }))).toBe(
      "https://skillpass-git-main.vercel.app",
    );
  });

  it("keeps localhost in development", () => {
    expect(appUrl(env({ NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000" }))).toBe(
      "http://localhost:3000",
    );
    expect(appUrl(env({ NODE_ENV: "development" }))).toBe("http://localhost:3000");
  });

  it("recognises local addresses", () => {
    expect(isLocalUrl("http://localhost:3000")).toBe(true);
    expect(isLocalUrl("http://127.0.0.1:3000/")).toBe(true);
    expect(isLocalUrl("https://skillpass.example.com")).toBe(false);
    expect(isLocalUrl("https://localhost.example.com")).toBe(false);
  });
});
