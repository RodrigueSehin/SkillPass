import { expect, test } from "@playwright/test";

// Only static facts here: other specs start attempts on the same demo server.
test("assessments page: figures, list and URL-driven filters", async ({ page }) => {
  await page.goto("/dashboard/assessments");
  await expect(page.getByRole("heading", { level: 1, name: "Évaluations" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Indicateurs" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Power Apps — Niveau Avancé/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voir mes certifications" })).toHaveAttribute(
    "href",
    "/dashboard/certifications",
  );

  await page.getByLabel("Rechercher une évaluation").fill("dataverse");
  await expect(page).toHaveURL(/q=dataverse/);
  await expect(page.getByRole("heading", { name: /Dataverse — Niveau Avancé/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Power Apps — Niveau Avancé/ })).toHaveCount(0);

  await page.getByRole("button", { name: "Réinitialiser" }).click();
  await expect(page).toHaveURL(/\/dashboard\/assessments$/);
  await expect(page.getByRole("heading", { name: /Power Apps — Niveau Avancé/ })).toBeVisible();
});

test("assessments page: an unknown tab in the URL falls back to the full list", async ({ page }) => {
  await page.goto("/dashboard/assessments?tab=nope&result=bogus");
  await expect(page.getByRole("heading", { name: /Power Apps — Niveau Avancé/ })).toBeVisible();
});
