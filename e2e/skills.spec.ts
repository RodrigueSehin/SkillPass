import { expect, test } from "@playwright/test";

// Runs against the in-memory demo repository (no DATABASE_URL). Unique names keep the
// desktop and mobile projects from colliding on the shared server state.
test("skills: add, filter, edit and delete", async ({ page }, testInfo) => {
  const name = `E2E Skill ${testInfo.project.name} ${Date.now()}`;
  await page.goto("/dashboard/skills");
  await expect(page.getByRole("heading", { name: "Compétences", level: 1 })).toBeVisible();
  await expect(page.getByText("Power Apps").first()).toBeVisible();

  await page.getByRole("button", { name: "Ajouter une compétence" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Ajouter une compétence" });
  await dialog.getByLabel("Nom de la compétence").fill(name);
  await dialog.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();

  await page.getByLabel("Rechercher une compétence").fill(name);
  await expect(page).toHaveURL(/q=/);
  await expect(page.getByRole("link", { name })).toBeVisible();
  await expect(page.getByText("Power Automate")).toHaveCount(0);

  await page.getByRole("button", { name: `Modifier ${name}` }).click();
  const edit = page.getByRole("dialog", { name: `Modifier ${name}` });
  await edit.getByLabel("Niveau").selectOption("ADVANCED");
  await edit.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(/an · Avancé/)).toBeVisible();

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
