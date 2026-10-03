import { expect, test } from "@playwright/test";

test("landing: hero, stats and the six strengths are present", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Prouvez vos compétences.");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Construisez votre avenir.");
  await expect(page.getByText("Le passeport numérique des compétences").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Explorer les talents/ })).toBeVisible();

  const strengths = page.getByRole("region", { name: "Les atouts de SkillPass" }).getByRole("listitem");
  await expect(strengths).toHaveCount(6);
  await expect(page.getByRole("heading", { name: /De vos compétences\s+aux opportunités/ })).toBeVisible();
});

test("landing: ids are unique so every anchor link has a single target", async ({ page }) => {
  await page.goto("/");
  const duplicates = await page.evaluate(() => {
    const seen = new Map<string, number>();
    document.querySelectorAll("[id]").forEach((el) => seen.set(el.id, (seen.get(el.id) ?? 0) + 1));
    return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
  });
  expect(duplicates).toEqual([]);
});

test("landing: every in-page navigation link points to an existing section", async ({ page }) => {
  await page.goto("/");
  const missing = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[href^="/#"], a[href^="#"]')]
      .map((a) => a.getAttribute("href")!.replace(/^\//, ""))
      .filter((hash) => hash.length > 1 && !document.querySelector(hash)),
  );
  expect(missing).toEqual([]);
});

test("landing: no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test("landing (desktop): the Ressources menu opens, lists anchors and closes with Escape", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop navigation");
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Ressources" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menuitem", { name: "Pour les entreprises" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);

  await page.getByRole("link", { name: "Tarifs", exact: true }).first().click();
  await expect(page).toHaveURL(/#tarifs$/, { timeout: 15_000 });
  await expect(page.locator("#tarifs")).toBeInViewport({ timeout: 15_000 });
});

test("landing (mobile): the menu opens, navigates and closes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile navigation");
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const menu = page.getByRole("navigation", { name: "Menu mobile" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Tarifs" }).click();
  await expect(menu).toHaveCount(0);
  await expect(page).toHaveURL(/#tarifs$/, { timeout: 15_000 });
});
