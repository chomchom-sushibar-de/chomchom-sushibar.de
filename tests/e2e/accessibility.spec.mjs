import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { unlockPreview } from "./helpers.mjs";

test.beforeEach(async ({ page }) => {
  await unlockPreview(page);
});

for (const language of ["de", "en"]) {
  test(`home and menu have no serious accessibility violations in ${language}`, async ({ page }) => {
    for (const path of ["/index.html", "/speisekarte.html"]) {
      await page.goto(path);
      if (language === "en") await page.locator('[data-lang="en"]').click();
      const results = await new AxeBuilder({ page }).analyze();
      const violations = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    }
  });
}

test("open order dialog remains accessible", async ({ page }) => {
  await page.goto("/speisekarte.html");
  await page.locator('[data-item-id="vorspeisen-11"] .qty-plus').click();
  await page.locator('[data-item-id="desserts-80"] .qty-plus').click();
  await page.locator("#order-bar-btn").click();
  const results = await new AxeBuilder({ page }).include("#order-modal").analyze();
  const violations = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
