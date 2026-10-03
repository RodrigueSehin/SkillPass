import { expect, test } from "@playwright/test";

// Runs against the in-memory demo repositories. Unique titles keep desktop/mobile runs independent.

test("projects: create with linked skills, edit, delete", async ({ page }, testInfo) => {
  const name = `E2E Projet ${testInfo.project.name} ${Date.now()}`;
  await page.goto("/dashboard/projects");
  await expect(page.getByRole("heading", { name: "A' Quotation" })).toBeVisible();

  await page.getByRole("button", { name: "Ajouter un projet" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Ajouter un projet" });
  await dialog.getByLabel("Nom du projet").fill(name);
  await dialog.getByText("Dataverse", { exact: true }).click();
  await dialog.getByRole("button", { name: "Ajouter", exact: true }).click();
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) });
  await expect(card.getByText("Dataverse")).toBeVisible();

  await page.getByRole("button", { name: `Modifier ${name}` }).click();
  const edit = page.getByRole("dialog", { name: `Modifier ${name}` });
  await edit.getByLabel("Rôle").fill("Lead");
  await edit.getByRole("button", { name: "Enregistrer" }).click();
  await expect(card.getByText("Lead")).toBeVisible();

  await page.getByRole("button", { name: `Supprimer ${name}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByRole("heading", { name })).toHaveCount(0);
});

test("projects: inline validation blocks an invalid URL", async ({ page }) => {
  await page.goto("/dashboard/projects");
  await page.getByRole("button", { name: "Ajouter un projet" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Ajouter un projet" });
  await dialog.getByLabel("Nom du projet").fill("Projet invalide");
  await dialog.getByLabel("URL du projet").fill("pas une url");
  await dialog.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(dialog.getByText("URL invalide")).toBeVisible();
});

test("experiences: add an ongoing position", async ({ page }, testInfo) => {
  const title = `E2E Poste ${testInfo.project.name} ${Date.now()}`;
  await page.goto("/dashboard/experiences");
  await page.getByRole("button", { name: "Ajouter une expérience" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Ajouter une expérience" });
  await dialog.getByLabel(/Intitulé du poste/).fill(title);
  await dialog.getByLabel(/Entreprise/).fill("ACME");
  await dialog.getByLabel(/Date de début/).fill("2024-02-01");
  await dialog.getByRole("button", { name: "Ajouter", exact: true }).click();
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: title }) });
  await expect(card.getByText(/En cours/)).toBeVisible();

  await page.getByRole("button", { name: `Supprimer ${title}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
});

test("certifications: a new certification starts unverified", async ({ page }, testInfo) => {
  const name = `E2E Cert ${testInfo.project.name} ${Date.now()}`;
  await page.goto("/dashboard/certifications");
  await expect(page.getByRole("heading", { name: /PL-200/ })).toBeVisible();
  await page.getByRole("button", { name: "Ajouter une certification" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Ajouter une certification" });
  await dialog.getByLabel(/Nom de la certification/).fill(name);
  await dialog.getByLabel(/Émetteur/).fill("Microsoft");
  await dialog.getByLabel(/Date d'émission/).fill("2025-05-01");
  await dialog.getByRole("button", { name: "Ajouter", exact: true }).click();
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) });
  await expect(card.getByText("Non vérifiée")).toBeVisible();

  await page.getByRole("button", { name: `Supprimer ${name}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByRole("heading", { name })).toHaveCount(0);
});

test("portfolio API validates payloads and lists items", async ({ request }) => {
  const bad = await request.post("/api/projects", { data: { name: "x" } });
  expect(bad.status()).toBe(400);
  const list = await request.get("/api/certifications");
  expect(list.status()).toBe(200);
  expect((await list.json()).items.length).toBeGreaterThan(0);
  const missing = await request.get("/api/experiences/00000000-0000-4000-8000-000000000000");
  expect(missing.status()).toBe(404);
});
