import { expect, test } from "@playwright/test";

// Runs against the in-memory demo repositories and the local ./.uploads storage.
const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n",
);
const FAKE_PDF = Buffer.from("MZ\x90\x00 this is not a pdf");

test("skill detail explains verification and lists evidence", async ({ page }) => {
  await page.goto("/dashboard/skills/demo-skill-power-apps");
  await expect(page.getByRole("heading", { level: 1, name: "Power Apps" })).toBeVisible();
  await expect(page.getByText("Pourquoi cette compétence est-elle vérifiée ?")).toBeVisible();
  await expect(page.getByText("Au moins une preuve vérifiée")).toBeVisible();
  await expect(page.getByText("Passez l'évaluation correspondante")).toBeVisible();
  await expect(page.getByRole("heading", { name: "A' Quotation" })).toBeVisible();
});

test("skill detail shows a not-found state for an unknown skill", async ({ page }) => {
  // Streaming commits the 200 status before notFound() runs, so assert on the rendered state.
  await page.goto("/dashboard/skills/does-not-exist");
  await expect(page.getByText("Élément introuvable")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(0);
});

test("evidence: add a link from the skill page, then delete it", async ({ page }, testInfo) => {
  const title = `E2E Lien ${testInfo.project.name} ${Date.now()}`;
  await page.goto("/dashboard/skills/demo-skill-ui-ux");
  await page.getByRole("button", { name: "Ajouter une preuve" }).click();
  const dialog = page.getByRole("dialog", { name: "Ajouter une preuve" });
  await dialog.getByLabel("Type de preuve").selectOption("LINK");
  await dialog.getByLabel("Titre").fill(title);
  await dialog.getByRole("button", { name: "Ajouter la preuve" }).click();
  await expect(dialog.getByText("Une URL est requise pour ce type de preuve")).toBeVisible();

  await dialog.getByLabel("URL").fill("https://example.com/maquettes");
  await dialog.getByRole("button", { name: "Ajouter la preuve" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("button", { name: `Supprimer ${title}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0, { timeout: 15_000 });
});

test("evidence: upload a PDF through the UI and download it with hardened headers", async ({
  page,
  request,
}, testInfo) => {
  const title = `E2E PDF ${testInfo.project.name} ${Date.now()}`;
  await page.goto("/dashboard/evidence");
  await page.getByRole("button", { name: "Ajouter une preuve" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Ajouter une preuve" });
  await dialog.getByLabel("Compétence démontrée").selectOption({ label: "UI/UX" });
  await dialog.getByLabel("Type de preuve").selectOption("DOCUMENT");
  await dialog.getByLabel("Titre").fill(title);
  await dialog.getByRole("button", { name: "Ajouter la preuve" }).click();
  await expect(dialog.getByText("Ajoutez un fichier pour ce type de preuve")).toBeVisible();

  await dialog
    .getByLabel(/Fichier/)
    .setInputFiles({ name: "cahier.pdf", mimeType: "application/pdf", buffer: MINIMAL_PDF });
  await dialog.getByRole("button", { name: "Ajouter la preuve" }).click();
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: title }) });
  await expect(card.getByRole("link", { name: /cahier\.pdf/ })).toBeVisible();

  const href = await card.getByRole("link", { name: /cahier\.pdf/ }).getAttribute("href");
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("application/pdf");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["content-security-policy"]).toContain("sandbox");
  expect(await res.body()).toEqual(MINIMAL_PDF);

  await page.getByRole("button", { name: `Supprimer ${title}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0, { timeout: 15_000 });
  expect((await request.get(href!)).status()).toBe(404);
});

test("evidence API rejects a disguised executable and unknown skills", async ({ request }) => {
  const fake = await request.post("/api/evidence", {
    multipart: {
      talentSkillId: "demo-skill-ui-ux",
      type: "DOCUMENT",
      title: "Faux PDF",
      file: { name: "x.pdf", mimeType: "application/pdf", buffer: FAKE_PDF },
    },
  });
  expect(fake.status()).toBe(400);
  expect((await fake.json()).error.code).toBe("INVALID_UPLOAD");

  const unknown = await request.post("/api/evidence", {
    multipart: { talentSkillId: "nope", type: "LINK", title: "Lien", url: "https://example.com" },
  });
  expect(unknown.status()).toBe(404);

  const assessment = await request.post("/api/evidence", {
    multipart: { talentSkillId: "demo-skill-ui-ux", type: "ASSESSMENT", title: "Triche" },
  });
  expect(assessment.status()).toBe(400);
});

test("dashboard shows real numbers computed from the portfolio", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByText("Bonjour Sehin")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Complétion de votre profil" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Score SkillPass/ })).toBeVisible();
  await expect(page.getByText("A' Quotation").first()).toBeVisible();
});
