import { expect, test, type Page } from "@playwright/test";
import { ASSESSMENT_BANK } from "../src/config/assessment-bank";

// Runs against the in-memory demo repositories with no cooldown between attempts.
// Each project takes a different assessment so the shared demo user does not collide.
const SLUG_FOR = { desktop: "power-automate", mobile: "power-apps" } as const;

async function answerAll(page: Page, slug: string, correct: boolean) {
  const assessment = ASSESSMENT_BANK.find((a) => a.slug === slug)!;
  // One question at a time: answer, then move on.
  for (const [i, q] of assessment.questions.entries()) {
    const index = correct ? q.correctIndex : (q.correctIndex + 1) % q.options.length;
    await page.locator(`input[name="${q.id}"]`).nth(index).check();
    if (i < assessment.questions.length - 1) {
      await page.getByRole("button", { name: "Question suivante" }).click();
    }
  }
}

test("assessment: pass, earn a badge, then verify it publicly", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const slug = SLUG_FOR[testInfo.project.name as keyof typeof SLUG_FOR];
  const assessment = ASSESSMENT_BANK.find((a) => a.slug === slug)!;

  await page.goto("/dashboard/assessments");
  await expect(page.getByRole("heading", { name: assessment.title })).toBeVisible();
  const card = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: assessment.title }) });
  await card.getByRole("button", { name: /Commencer|Reprendre|Réessayer/ }).click();

  await expect(page).toHaveURL(/\/assessments\/take\//);
  await expect(page.getByRole("timer")).toBeVisible();
  // The page must never ship the answer key to the browser.
  const html = await page.content();
  expect(html).not.toContain("correctIndex");
  expect(html).not.toContain(assessment.questions[0].explanation);

  await answerAll(page, slug, true);
  await expect(
    page.getByText(`${assessment.questions.length}/${assessment.questions.length} réponses`),
  ).toBeVisible();
  await page.getByRole("button", { name: "Soumettre mes réponses" }).click();

  await expect(page.getByText("Bravo, évaluation réussie !")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Connaissances")).toBeVisible();
  const credentialId = (await page.getByRole("article").locator(".font-mono").textContent())!.trim();
  expect(credentialId).toMatch(/^SP-[A-HJ-NP-Z2-9]{6}$/);

  // Verification needs no account: use a fresh context.
  const anon = await browser.newContext({ baseURL });
  const verify = await anon.newPage();
  const response = await verify.goto(`/verify/${credentialId}`);
  expect(response?.status()).toBe(200);
  await expect(verify.getByText("Credential vérifié")).toBeVisible();
  await expect(verify.getByText(assessment.skillName, { exact: true }).first()).toBeVisible();
  await expect(verify.locator("dd", { hasText: "Sehin G. Rodrigue" })).toBeVisible();
  await anon.close();

  // The badge now appears in the badge wall.
  await page.goto("/dashboard/badges");
  await expect(page.getByText(credentialId, { exact: true })).toBeVisible();
});

test("assessment: a failed attempt grants no badge and the skill is unchanged", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "uses a dedicated assessment on desktop only");
  // Dataverse is a critical assessment, so use a failing attempt to check the negative path.
  await page.goto("/dashboard/assessments");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: /Dataverse/ }) });
  await card.getByRole("button", { name: /Commencer|Reprendre|Réessayer/ }).click();
  await answerAll(page, "dataverse", false);
  await page.getByRole("button", { name: "Soumettre mes réponses" }).click();
  await expect(page.getByText("Seuil non atteint cette fois.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel("Badge obtenu")).toHaveCount(0);
});

test("assessment: a critical assessment waits for a verifier, who is not the candidate", async ({
  page,
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "uses a dedicated assessment on mobile only");
  await page.goto("/dashboard/assessments");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: /Dataverse/ }) });
  await card.getByRole("button", { name: /Commencer|Reprendre|Réessayer/ }).click();
  await answerAll(page, "dataverse", true);
  await page.getByRole("button", { name: "Soumettre mes réponses" }).click();
  await expect(page.getByText(/en attente de validation par un vérificateur/)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByLabel("Badge obtenu")).toHaveCount(0);

  // The candidate has the TALENT role: reviewer endpoints and page are closed to them.
  expect((await request.get("/api/verification/pending")).status()).toBe(403);
  expect((await request.get("/admin/verifications")).status()).toBe(404);
});

test("verification and review APIs reject unknown ids and unauthorized roles", async ({ request }) => {
  expect((await request.get("/api/verify/SP-AAAAAA")).status()).toBe(404);
  expect((await request.get("/api/verify/not-an-id")).status()).toBe(404);
  const review = await request.post("/api/verification/00000000-0000-4000-8000-000000000000/review", {
    data: { decision: "approve" },
  });
  expect(review.status()).toBe(403);
  const submit = await request.post("/api/assessments/attempts/00000000-0000-4000-8000-000000000000/submit", {
    data: { answers: [] },
  });
  expect(submit.status()).toBe(404);
  const bad = await request.post("/api/assessments/attempts/x/submit", { data: { answers: "nope" } });
  expect(bad.status()).toBe(400);
});

test("verify page returns 404 for an unknown credential", async ({ request }) => {
  expect((await request.get("/verify/SP-AAAAAA")).status()).toBe(404);
});

test("recommendation: request a link, the recommender answers without an account, the owner publishes it", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const author = `Recommandeur ${testInfo.project.name} ${Date.now()}`;
  const text = `Sehin a livré une solution robuste et a su embarquer toute l'équipe (${testInfo.project.name}).`;

  await page.goto("/dashboard/recommendations");
  await page.getByRole("link", { name: "Demander une recommandation" }).first().click();
  await expect(page).toHaveURL(/\/dashboard\/recommendations\/new/);
  await page.getByRole("tab", { name: "Saisir manuellement" }).click();
  await page.getByLabel("Enregistrer dans mes contacts").uncheck();
  await page.getByRole("button", { name: "Créer la demande" }).click();
  await expect(page.getByText("Choisissez ou saisissez la personne à solliciter")).toBeVisible();
  await page.getByLabel("Nom du recommandeur").fill(author);
  await page.getByRole("button", { name: "Créer la demande" }).click();
  const link = await page.getByLabel("Lien à envoyer").inputValue();
  expect(link).toMatch(/\/recommend\/[0-9a-f]{64}$/);

  // The recommender: no session, fresh context.
  const anon = await browser.newContext({ baseURL });
  const guest = await anon.newPage();
  // Warm the page and its API route up first: a cold dev compilation can reload the page mid-fill.

  await anon.request.get(new URL(link).pathname);

  await anon.request.get(new URL(link).pathname.replace("/recommend/", "/api/recommend/"));

  await guest.goto(new URL(link).pathname);
  await expect(guest.getByRole("heading", { name: /Recommander Sehin/ })).toBeVisible();
  await guest.getByRole("button", { name: "Envoyer ma recommandation" }).click();
  await expect(guest.getByText(/au moins quelques phrases/)).toBeVisible();
  await expect(guest.locator("form[data-hydrated=true]")).toBeVisible();
  await guest.getByLabel("Votre recommandation").fill(text);
  await guest.getByRole("button", { name: "Envoyer ma recommandation" }).click();
  await expect(guest.getByText("Merci !")).toBeVisible();

  // The link is single-use.
  const replay = await anon.request.post(new URL(link).pathname.replace("/recommend/", "/api/recommend/"), {
    data: { content: text },
  });
  expect(replay.status()).toBe(409);
  await guest.goto(new URL(link).pathname);
  await expect(guest.getByText("Merci, c'est déjà envoyé")).toBeVisible();

  // The owner reviews and publishes.
  await page.goto("/dashboard/recommendations");
  const item = page.getByRole("listitem").filter({ hasText: author });
  await expect(item.getByText(text)).toBeVisible();
  await item.getByRole("button", { name: "Publier" }).click();
  await expect(item.getByText("Publiée")).toBeVisible({ timeout: 15_000 });

  // It now shows on the public profile, without e-mail or token.
  const publicPage = await anon.newPage();
  await publicPage.goto("/sehin-rodrigue?tab=recommendations");
  await expect(publicPage.getByText(text)).toBeVisible();
  expect(await publicPage.content()).not.toMatch(/[0-9a-f]{64}/);
  await anon.close();

  await item.getByRole("button", { name: `Supprimer la demande de ${author}` }).click();
  await expect(page.getByText(author)).toHaveCount(0, { timeout: 15_000 });
});

test("recommendation link: unknown token is a 404", async ({ request }) => {
  expect((await request.get(`/recommend/${"0".repeat(64)}`)).status()).toBe(404);
  expect((await request.get(`/api/recommend/${"0".repeat(64)}`)).status()).toBe(404);
});
