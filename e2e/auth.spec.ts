import { expect, test } from "@playwright/test";

// UI only: these specs never submit credentials, so they are safe against any environment.

test("login: shows the welcome card, tabs, social sign-in and the sign-up shortcut", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1, name: "Bienvenue sur SkillPass" })).toBeVisible();

  const tabs = page.getByRole("navigation", { name: "Connexion ou inscription" });
  await expect(tabs.getByRole("link", { name: "Connexion" })).toHaveAttribute("aria-current", "page");
  await expect(tabs.getByRole("link", { name: "Créer un compte" })).toHaveAttribute("href", "/register");

  await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
  await expect(page.getByLabel("Mot de passe", { exact: true })).toHaveAttribute("type", "password");
  await expect(page.getByRole("checkbox", { name: "Se souvenir de moi" })).toBeChecked();
  await expect(page.getByRole("link", { name: "Mot de passe oublié ?" })).toHaveAttribute(
    "href",
    "/forgot-password",
  );
  await expect(page.getByRole("button", { name: /Se connecter$/ })).toBeVisible();

  for (const provider of ["Microsoft", "Google", "LinkedIn"]) {
    await expect(page.getByRole("button", { name: `Se connecter avec ${provider}` })).toBeVisible();
  }
  await expect(page.getByText("Vous n'avez pas encore de compte ?")).toBeVisible();
});

test("login: the password can be revealed and hidden again", async ({ page }) => {
  await page.goto("/login");
  const password = page.getByLabel("Mot de passe", { exact: true });
  await password.fill("secret-123");
  await page.getByRole("button", { name: "Afficher le mot de passe" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Masquer le mot de passe" }).click();
  await expect(password).toHaveAttribute("type", "password");
});

test("login (desktop): the left panel carries the pitch, the photo and the real logo", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the showcase panel is desktop-only");
  await page.goto("/login");
  const panel = page.locator("aside");
  await expect(page.getByRole("heading", { level: 1, name: /Bienvenue/ })).toBeVisible();
  await expect(panel.getByText("Des talents vérifiés.")).toBeVisible();
  await expect(panel.getByText("Des équipes performantes.")).toBeVisible();
  for (const title of ["Recrutez plus vite", "Réduisez les risques", "Prenez de meilleures décisions"]) {
    await expect(panel.getByRole("heading", { name: title })).toBeVisible();
  }
  await expect(panel.getByText("tomorrow")).toBeVisible();

  // Both brand logos and the photo are real image files that actually loaded.
  const loaded = await page.evaluate(() =>
    [...document.querySelectorAll("img")].map((img) => ({
      alt: img.alt,
      ok: img.complete && img.naturalWidth > 0,
    })),
  );
  expect(loaded.length).toBeGreaterThanOrEqual(2);
  expect(loaded.filter((i) => !i.ok)).toEqual([]);
});

test("login (mobile): a compact banner replaces the left panel", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile layout");
  await page.goto("/login");
  await expect(page.getByText("Des talents vérifiés.").first()).toBeVisible();
  await expect(page.getByText("Recrutez plus vite")).toBeHidden();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test("login: submitting empty fields keeps the user on the page with an explanation", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Se connecter$/ }).click();
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/login/);
});

test("the tabs move between sign-in and sign-up inside the same shell", async ({ page }) => {
  await page.goto("/login");
  await page
    .getByRole("navigation", { name: "Connexion ou inscription" })
    .getByRole("link", { name: "Créer un compte" })
    .click();
  await expect(page).toHaveURL(/\/register/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Créer mon SkillPass" })).toBeVisible();
  await expect(page.getByRole("button", { name: "S'inscrire avec Google" })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Connexion ou inscription" })
      .getByRole("link", { name: "Créer un compte" }),
  ).toHaveAttribute("aria-current", "page");
});

test("forgot-password and verify-email use the same shell", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { level: 1, name: "Mot de passe oublié" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Retour à la connexion/ })).toBeVisible();
  await page.goto("/verify-email");
  await expect(page.getByRole("heading", { level: 1, name: "Vérifiez votre e-mail" })).toBeVisible();
});
