import { expect, test } from "@playwright/test";

// Runs against the in-memory demo repository (no DATABASE_URL). Unique names keep the
// desktop and mobile projects from colliding on the shared server state.
test("skills: add, filter, edit and delete", async ({ page }, testInfo) => {
  const name = `E2E Skill ${testInfo.project.name} ${Date.now()}`;
  await page.goto("/dashboard/skills");
  await expect(page.getByRole("heading", { name: "Compétences", level: 1 })).toBeVisible();
  await expect(page.getByText("Power Apps").first()).toBeVisible();

  await page.getByRole("link", { name: "Ajouter une compétence" }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/skills\/new/);
  await expect(page.getByRole("heading", { level: 1, name: "Ajouter une compétence" })).toBeVisible();
  await page.getByLabel(/Nom de la compétence/).fill(name);
  await page.getByLabel("Catégorie").fill("Power Platform");
  await page.getByRole("radio", { name: "Avancé" }).check({ force: true });
  await page.getByRole("button", { name: "Enregistrer la compétence" }).click();
  await expect(page).toHaveURL(/\/dashboard\/skills$/, { timeout: 20_000 });
  await expect(page.getByRole("link", { name })).toBeVisible();

  await page.getByLabel("Rechercher une compétence").fill(name);
  await expect(page).toHaveURL(/q=/);
  await expect(page.getByRole("link", { name })).toBeVisible();
  await expect(page.getByText("Power Automate")).toHaveCount(0);

  await page.getByRole("button", { name: `Modifier ${name}` }).click();
  const edit = page.getByRole("dialog", { name: `Modifier ${name}` });
  await edit.getByLabel("Niveau").selectOption("EXPERT");
  await edit.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("article").filter({ hasText: name }).getByText("Expert")).toBeVisible();

  await page.getByRole("button", { name: `Supprimer ${name}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByRole("link", { name })).toHaveCount(0);
});

test("skills API requires a valid payload", async ({ request }) => {
  const res = await request.post("/api/talent-skills", {
    data: { name: "x", level: "EXPERT", yearsOfExperience: 1 },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error.code).toBe("VALIDATION");
});

test("add skill page: validation, and a suggestion pre-fills the name", async ({ page }) => {
  await page.goto("/dashboard/skills/new");
  await page.getByRole("button", { name: "Enregistrer la compétence" }).click();
  await expect(page.getByText("Nom trop court")).toBeVisible();

  await page.getByRole("link", { name: "Dataverse", exact: true }).click();
  await expect(page).toHaveURL(/name=Dataverse/);
  await expect(page.getByLabel(/Nom de la compétence/)).toHaveValue("Dataverse");

  // Dataverse is already in the demo profile: the server says so instead of duplicating it.
  await page.getByRole("button", { name: "Enregistrer la compétence" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "figure déjà" })).toBeVisible();
});
