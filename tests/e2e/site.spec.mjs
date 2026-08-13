import { expect, test } from "@playwright/test";
import { unlockPreview, watchRuntime } from "./helpers.mjs";

test.beforeEach(async ({ page }) => {
  await unlockPreview(page);
});

test("language, theme, navigation, and local content persist without external requests", async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await page.route("**/data/site.json", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        announcement: { de: "Heute Testhinweis", en: "Test notice today" },
        hours: {
          weekday: {
            shortLabel: { de: "Mo–Fr", en: "Mon–Fri" },
            tableLabel: { de: "Montag – Freitag", en: "Monday – Friday" },
            legalLabel: { de: "Montag bis Freitag", en: "Monday to Friday" },
            schemaDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            periods: [{ opens: "12:00", closes: "14:00" }, { opens: "18:00", closes: "22:00" }]
          },
          sundayHolidays: {
            shortLabel: { de: "So & Feiertag", en: "Sun & public holidays" },
            tableLabel: { de: "Sonntag & Feiertag", en: "Sunday & public holidays" },
            legalLabel: { de: "Sonntag und feiertags", en: "Sunday and public holidays" },
            schemaDays: ["Sunday"],
            periods: [{ opens: "18:00", closes: "22:00" }]
          },
          saturday: {
            shortLabel: { de: "Sa", en: "Sat" },
            tableLabel: { de: "Samstag", en: "Saturday" },
            legalLabel: { de: "Samstag", en: "Saturday" },
            status: { de: "Ruhetag", en: "Closed" },
            inlineStatus: { de: "Ruhetag", en: "closed" }
          }
        }
      })
    });
  });
  await page.goto("/index.html");
  await expect(page.locator("h1")).toContainText("Vietnamesische Küche");
  await expect(page.locator("#site-announcement")).toHaveText("Heute Testhinweis");
  await expect(page.locator('[data-hours="hero_weekday_ranges"]')).toHaveText("12:00–14:00 & 18:00–22:00");
  await expect(page.locator('[data-hours="footer_line1"]')).toHaveText("Mo–Fr 12:00–14:00 Uhr");
  await page.locator('[data-lang="en"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1")).toContainText("Vietnamese & Sushi Cuisine");
  await expect(page.locator("#site-announcement")).toHaveText("Test notice today");
  await expect(page.locator('[data-hours="footer_line1"]')).toHaveText("Mon–Fri 12:00–14:00");
  await page.locator('[data-theme="dark"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const width = page.viewportSize().width;
  const toggle = page.locator(".nav-toggle");
  if (width <= 1020) {
    await expect(toggle).toBeVisible();
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".main-nav")).toHaveClass(/open/);
    await expect(page.locator(".main-nav")).toHaveCSS("opacity", "1");
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator(".main-nav a").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  } else {
    await expect(toggle).toBeHidden();
    await expect(page.locator(".main-nav")).toBeVisible();
  }
  assertRuntime();
});

test("contact, outdoor, legal, and nested 404 routes remain usable", async ({ page }) => {
  for (const [path, germanHeading, englishHeading] of [
    ["/kontakt.html", "Anfahrt & Kontakt", "Directions & Contact"],
    ["/aussenbereich.html", "Unser kleiner Außenbereich im Sommer", "Our Small Outdoor Area in Summer"],
    ["/impressum.html", "Impressum", "Legal Notice"],
    ["/datenschutz.html", "Datenschutzerklärung", "Privacy Policy"]
  ]) {
    await page.goto(path);
    await page.locator('[data-lang="de"]').click();
    await expect(page.locator("main h1")).toHaveText(germanHeading);
    await page.locator('[data-lang="en"]').click();
    await expect(page.locator("main h1")).toHaveText(englishHeading);
  }
  const response = await page.goto("/verschachtelt/fehlt");
  expect(response.status()).toBe(404);
  await expect(page.locator("main h1")).toHaveText("This page doesn't exist.");
  await expect(page.locator(".brand-mark-light")).toBeVisible();
  await expect(page.locator(".error-page .btn-primary")).toHaveAttribute("href", "index.html");
});

test("corrupt theme and language storage fall back safely", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("chomchom-lang", "xx");
    localStorage.setItem("chomchom-theme", "neon");
  });
  await page.goto("/index.html");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  const stored = await page.evaluate(() => ({ lang: localStorage.getItem("chomchom-lang"), theme: localStorage.getItem("chomchom-theme") }));
  expect(stored).toEqual({ lang: null, theme: null });
});
