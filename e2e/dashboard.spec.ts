import { expect, test } from "@playwright/test";

// Runs against the in-memory demo repositories (demo user "Sehin G. Rodrigue").

test("dashboard: greeting, the four figures and the completion card", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: /Bonjour Sehin/ })).toBeVisible();
  await expect(page.getByText("Voici un aperçu de votre activité sur SkillPass.")).toBeVisible();

  const kpis = page.getByRole("region", { name: "Indicateurs" });
  for (const [label, href] of [
    ["Compétences", "/dashboard/skills"],
    ["Badges", "/dashboard/badges"],
    ["Projets", "/dashboard/projects"],
    ["Certifications", "/dashboard/certifications"],
  ] as const) {
    await expect(kpis.getByRole("link", { name: new RegExp(label) })).toHaveAttribute("href", href);
  }
  await expect(page.getByRole("progressbar", { name: "Complétion du profil" })).toBeVisible();
});

test("dashboard: top skills, passport banner, quick actions and the three bottom cards", async ({ page }) => {
  await page.goto("/dashboard");
  const top = page.getByRole("region", { name: "Top compétences" });
  await expect(top.getByRole("link", { name: /Power Apps/ })).toBeVisible();
  await expect(top.getByRole("progressbar").first()).toBeVisible();

  const banner = page.getByRole("region", { name: "Votre passeport numérique des compétences" });
  await expect(banner.getByRole("link", { name: /Voir mon SkillPass/ })).toHaveAttribute(
    "href",
    "/dashboard/skillpass",
  );
  await expect(banner.getByRole("img", { name: /Score SkillPass/ })).toBeVisible();

  const actions = page.getByRole("navigation", { name: "Actions rapides" });
  await expect(actions.getByRole("link")).toHaveCount(4);
  await expect(actions.getByRole("link", { name: "Passer une évaluation" })).toHaveAttribute(
    "href",
    "/dashboard/assessments",
  );

  await expect(page.getByRole("heading", { name: "Mes projets récents" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prochaines évaluations" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Opportunités d'emploi" })).toBeVisible();
  await expect(page.getByText("Le matching arrive bientôt")).toBeVisible();
  await expect(page.getByText(/visible publiquement via un lien sécurisé et un QR code/)).toBeVisible();
});

test("dashboard (desktop): the sidebar carries the 'Passer à Pro' card pointing to the offers", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the sidebar is desktop-only");
  await page.goto("/dashboard");
  const pro = page.getByRole("region", { name: "Passer à Pro" });
  await expect(pro).toBeVisible();
  await expect(
    pro.getByText("Débloquez toutes les fonctionnalités et accélérez votre carrière."),
  ).toBeVisible();
  await expect(pro.getByRole("link", { name: "Voir les offres" })).toHaveAttribute("href", "/#tarifs");

  // The card stays reachable even when the navigation is long: it is not inside the scrolling list.
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Dashboard" }),
  ).toHaveAttribute("aria-current", "page");
});

test("dashboard: the account menu shows name and role, links and signs out", async ({ page }) => {
  await page.goto("/dashboard");
  const trigger = page.getByRole("button", { name: "Menu du compte" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  const menu = page.getByRole("menu", { name: "Menu du compte" });
  await expect(menu.getByRole("menuitem", { name: "Mon SkillPass" })).toHaveAttribute(
    "href",
    "/dashboard/skillpass",
  );
  await expect(menu.getByRole("menuitem", { name: "Paramètres" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Déconnexion" })).toBeVisible();
  // The demo user is a plain talent: no reviewer shortcut.
  await expect(menu.getByRole("menuitem", { name: "Validations en attente" })).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("dashboard: the account menu closes when clicking elsewhere and navigates from its links", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Menu du compte" }).click();
  // A spot far from the open panel (on phones the panel covers the middle of the page).
  await page.locator("main").click({ position: { x: 4, y: 300 } });
  await expect(page.getByRole("menu")).toHaveCount(0);

  await page.getByRole("button", { name: "Menu du compte" }).click();
  await page.getByRole("menuitem", { name: "Paramètres" }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings/, { timeout: 20_000 });
});

test("dashboard: notification and message panels say what is (not yet) there", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Notifications" }).click();
  await expect(page.getByText(/Aucune notification pour l'instant/)).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Messages" }).click();
  await expect(page.getByText("La messagerie arrive avec SkillPass Business.")).toBeVisible();
});

test("dashboard (desktop): the search box opens the skills list filtered by the query", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the search box is hidden on phones");
  await page.goto("/dashboard");
  await page.getByRole("searchbox", { name: "Rechercher dans mon espace" }).fill("dataverse");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/dashboard\/skills\?q=dataverse/, { timeout: 20_000 });
  await expect(page.getByRole("link", { name: "Dataverse" }).first()).toBeVisible();
  await expect(page.getByText("Power Automate")).toHaveCount(0);
});

test("dashboard: no horizontal scroll and every KPI label is fully visible", async ({ page }) => {
  await page.goto("/dashboard");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  const truncated = await page.evaluate(
    () =>
      [...document.querySelectorAll("section[aria-label='Indicateurs'] a span span:last-child")].filter(
        (el) => el.scrollWidth > el.clientWidth,
      ).length,
  );
  expect(truncated).toBe(0);
});

test("dashboard (mobile): the bottom navigation replaces the sidebar", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile layout");
  await page.goto("/dashboard");
  await expect(page.getByRole("navigation", { name: "Navigation mobile" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Passer à Pro" })).toBeHidden();
});
