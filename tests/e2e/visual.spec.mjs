import { expect, test } from "@playwright/test";
import { unlockPreview } from "./helpers.mjs";

for (const language of ["de", "en"]) {
  test(`home and menu visual baseline in ${language}`, async ({ page }) => {
    await unlockPreview(page, { language, theme: "light" });
    await page.goto("/index.html");
    await page.locator("img").first().waitFor({ state: "visible" });
    await expect(page).toHaveScreenshot(`${language}-home.png`, { fullPage: false, mask: [page.locator("#year")] });
    await page.goto("/speisekarte.html");
    await page.locator('[data-item-id="sushi-menues-200"]').scrollIntoViewIfNeeded();
    await expect(page).toHaveScreenshot(`${language}-menu.png`, { fullPage: false, mask: [page.locator("#year")] });
  });
}
