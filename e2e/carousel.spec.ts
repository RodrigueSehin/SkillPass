import { expect, test, type Page } from "@playwright/test";

const LABEL = /Ce que SkillPass apporte/;
const carousel = (page: Page) => page.getByRole("region", { name: LABEL });
const slide = (page: Page, n: number) => page.getByRole("group", { name: `${n} sur 3` });

async function open(page: Page, url = "/") {
  await page.goto(url);
  await carousel(page).scrollIntoViewIfNeeded();
}

test("carousel: exposes one slide at a time with text, points and a call to action", async ({ page }) => {
  await open(page);
  await expect(carousel(page)).toHaveAttribute("aria-roledescription", "carousel");
  await expect(slide(page, 1)).toBeVisible();
  await expect(
    slide(page, 1).getByRole("heading", { name: "Transformez vos compétences en preuves" }),
  ).toBeVisible();
  await expect(slide(page, 1).getByRole("link", { name: /Créer mon SkillPass/ })).toBeVisible();
  // Inactive slides are removed from the accessibility tree and cannot be focused.
  await expect(slide(page, 2)).toHaveCount(0);
  await expect(page.locator("#entreprises")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#entreprises")).toHaveJSProperty("inert", true);
});

test("carousel: next, previous and dots navigate and wrap around", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Diapositive suivante" }).click();
  await expect(slide(page, 2).getByRole("heading", { name: /Recrutez sur preuves/ })).toBeVisible();
  await page.getByRole("button", { name: "Diapositive suivante" }).click();
  await expect(slide(page, 3).getByRole("heading", { name: /Donnez de la valeur/ })).toBeVisible();
  await page.getByRole("button", { name: "Diapositive suivante" }).click();
  await expect(slide(page, 1)).toBeVisible();
  await page.getByRole("button", { name: "Diapositive précédente" }).click();
  await expect(slide(page, 3)).toBeVisible();

  await page.getByRole("button", { name: /Diapositive 2 : Pour les entreprises/ }).click();
  await expect(slide(page, 2)).toBeVisible();
  await expect(page.getByRole("button", { name: /Diapositive 2/ })).toHaveAttribute("aria-current", "true");
});

test("carousel: arrow keys move between slides", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "keyboard navigation");
  await open(page);
  await page.getByRole("button", { name: "Diapositive suivante" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(slide(page, 2)).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(slide(page, 1)).toBeVisible();
});

test("carousel: an anchor link opens the matching slide", async ({ page }) => {
  await page.goto("/#academies");
  await expect(slide(page, 3).getByRole("heading", { name: /Donnez de la valeur/ })).toBeVisible();
  // Navigating to another anchor on the same page works too (hashchange).
  await page.evaluate(() => (window.location.hash = "#entreprises"));
  await expect(slide(page, 2)).toBeVisible();
});

test("carousel: the pause button stops and resumes the automatic rotation", async ({ page }) => {
  await open(page);
  const pause = page.getByRole("button", { name: /Mettre le défilement automatique en pause/ });
  await expect(pause).toHaveAttribute("aria-pressed", "false");
  await pause.click();
  const resume = page.getByRole("button", { name: /Reprendre le défilement automatique/ });
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await resume.click();
  await expect(pause).toBeVisible();
});

test("carousel: advances by itself and stays put while paused", async ({ page }) => {
  test.setTimeout(60_000);
  await open(page);
  // Park the pointer away from the carousel so hover does not pause it.
  await page.mouse.move(2, 2);
  await expect(slide(page, 2)).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: /Mettre le défilement automatique en pause/ }).click();
  await page.waitForTimeout(8_000);
  await expect(slide(page, 2)).toBeVisible();
});

test("carousel: does not rotate by itself when the visitor prefers reduced motion", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await expect(page.getByRole("button", { name: /défilement automatique/ })).toBeDisabled();
  await page.waitForTimeout(8_500);
  await expect(slide(page, 1)).toBeVisible();
  // Manual navigation still works.
  await page.getByRole("button", { name: "Diapositive suivante" }).click();
  await expect(slide(page, 2)).toBeVisible();
});

test("carousel (touch): a horizontal swipe changes the slide", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "touch devices only");
  await open(page);
  const surface = page.locator("[aria-live]").filter({ has: page.locator("#talents") });
  const swipe = (fromX: number, toX: number) =>
    surface.evaluate(
      (el, [a, b]) => {
        const fire = (type: string, x: number) =>
          el.dispatchEvent(
            new PointerEvent(type, { pointerType: "touch", clientX: x, clientY: 200, bubbles: true }),
          );
        fire("pointerdown", a);
        fire("pointerup", b);
      },
      [fromX, toX],
    );
  await swipe(300, 100);
  await expect(slide(page, 2)).toBeVisible();
  await swipe(100, 300);
  await expect(slide(page, 1)).toBeVisible();
});

test("landing: count-up stats end on their real value and are read in full", async ({ page }) => {
  await page.goto("/");
  const stats = page.getByRole("term").filter({ hasText: "Talents enregistrés" });
  await expect(stats).toBeVisible();
  await expect(page.getByText("250K+", { exact: true }).first()).toBeAttached();
  await expect(page.locator("dd").filter({ hasText: "250K+" }).first()).toContainText("250K+");
  await page.waitForTimeout(2_000);
  await expect(
    page.locator("dd").filter({ hasText: "250K+" }).first().locator('[aria-hidden="true"]'),
  ).toHaveText("250K+");
});

test("landing: sections below the fold reveal as they scroll into view", async ({ page }) => {
  await page.goto("/");
  const pricing = page.locator("#tarifs [data-reveal]").first();
  await pricing.scrollIntoViewIfNeeded();
  await expect(pricing).toHaveCSS("opacity", "1", { timeout: 10_000 });
});

test("landing: with reduced motion everything is visible immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // The preference is applied on the client, so wait for hydration instead of checking at once.
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            [...document.querySelectorAll("[data-reveal]")].filter(
              (el) => getComputedStyle(el).opacity !== "1",
            ).length,
        ),
      { timeout: 10_000 },
    )
    .toBe(0);
});
