import { expect, test } from "@playwright/test";

// Demo data only; the add/delete flow lives in portfolio.spec.ts.
test("certifications page: status figures, filters in the URL, and a safe fallback", async ({ page }) => {
  await page.goto("/dashboard/certifications");
  await expect(page.getByRole("heading", { level: 1, name: "Certifications" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mon statut de certification" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Échéances à venir" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /PL-200/ })).toBeVisible();

  await page.getByLabel("Rechercher une certification").fill("power bi");
  await expect(page).toHaveURL(/q=power(\+|%20)bi/);
  await expect(page.getByRole("heading", { name: /PL-200/ })).toHaveCount(0);

  await page.getByRole("button", { name: "Réinitialiser" }).click();
  await expect(page.getByRole("heading", { name: /PL-200/ })).toBeVisible();

  await page.goto("/dashboard/certifications?tab=nope&verification=bogus&sort=%3F");
  await expect(page.getByRole("heading", { name: /PL-200/ })).toBeVisible();
});

test("certifications page: no horizontal scroll", async ({ page }) => {
  await page.goto("/dashboard/certifications");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
