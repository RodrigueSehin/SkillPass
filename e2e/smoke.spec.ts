import { expect, test } from "@playwright/test";

test("landing page exposes the main CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Prouvez vos compétences");
  await page.getByRole("link", { name: /Créer mon SkillPass/ }).first().click();
  await expect(page).toHaveURL(/\/register/);
});

test("register wizard validates the first step", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
});

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
});
