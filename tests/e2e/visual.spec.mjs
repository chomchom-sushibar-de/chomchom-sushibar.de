import { expect, test } from "@playwright/test";
import { unlockPreview } from "./helpers.mjs";

async function gotoVisuallySettled(page, path) {
  const siteData = page.waitForResponse((response) => response.url().endsWith("/data/site.json") && response.ok());
  await page.goto(path);
  await siteData;
  await page.evaluate(async () => {
    const viewportImages = Array.from(document.images).filter((image) => {
      const bounds = image.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && bounds.bottom > 0 && bounds.top < window.innerHeight;
    });
    await Promise.all(viewportImages.map(async (image) => {
      if (!image.complete) {
        await new Promise((resolve, reject) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", reject, { once: true });
        });
      }
      if (typeof image.decode === "function") await image.decode();
    }));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

for (const language of ["de", "en"]) {
  test(`home and menu visual baseline in ${language}`, async ({ page }) => {
    await unlockPreview(page, { language, theme: "light" });
    await gotoVisuallySettled(page, "/index.html");
    await expect(page).toHaveScreenshot(`${language}-home.png`, { fullPage: false, mask: [page.locator("#year")] });
    await gotoVisuallySettled(page, "/speisekarte.html");
    await page.locator('[data-item-id="sushi-menues-200"]').scrollIntoViewIfNeeded();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page).toHaveScreenshot(`${language}-menu.png`, { fullPage: false, mask: [page.locator("#year")] });
  });
}
