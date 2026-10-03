import { expect, test } from "@playwright/test";

test("Mon SkillPass shows the explainable score and switches tabs via the URL", async ({ page }) => {
  await page.goto("/dashboard/skillpass");
  await expect(page.getByRole("heading", { level: 1, name: /Sehin G. Rodrigue/ })).toBeVisible();
  await expect(page.getByRole("img", { name: /Score SkillPass/ })).toBeVisible();
  await expect(page.getByText("Pourquoi ce score ?")).toBeVisible();
  await expect(page.getByText("Compétences évaluées")).toBeVisible();

  await page
    .getByRole("navigation", { name: "Sections du SkillPass" })
    .getByRole("link", { name: "Certifications" })
    .click();
  await expect(page).toHaveURL(/tab=certifications/);
  await expect(page.getByText(/PL-200/).first()).toBeVisible();
});

test("public profile is reachable without authentication and leaks no private data", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  const response = await page.goto("/sehin-rodrigue");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sehin G. Rodrigue");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/sehin-rodrigue$/);

  const html = await page.content();
  expect(html).not.toContain("demo@skillpass.com");
  expect(html).not.toContain("Concevoir des solutions métiers à fort impact"); // private career goal

  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(ld!)).toMatchObject({ "@type": "Person", name: "Sehin G. Rodrigue" });
  await context.close();
});

test("unknown public profile returns 404", async ({ request }) => {
  const res = await request.get("/this-user-does-not-exist");
  expect(res.status()).toBe(404);
});

test("profile settings: validation, save and username conflict feedback", async ({ page }) => {
  await page.goto("/dashboard/settings");
  await page.getByLabel("Nom d'utilisateur (URL publique)").fill("login");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Ce nom d'utilisateur est réservé")).toBeVisible();

  await page.getByLabel("Nom d'utilisateur (URL publique)").fill("sehin-rodrigue");
  await page.getByLabel("Localisation").fill("Abidjan, Côte d'Ivoire");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Profil enregistré.")).toBeVisible();
});

test("profile API rejects invalid payloads", async ({ request }) => {
  const res = await request.patch("/api/profile", { data: { fullName: "x" } });
  expect(res.status()).toBe(400);
  const ok = await request.get("/api/profile");
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ username: "sehin-rodrigue" });
});
