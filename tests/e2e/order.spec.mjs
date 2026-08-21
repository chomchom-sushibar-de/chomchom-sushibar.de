import { expect, test } from "@playwright/test";
import { unlockPreview, watchRuntime } from "./helpers.mjs";

test.beforeEach(async ({ page }) => {
  await unlockPreview(page);
});

test("selection uses integer day/evening cents and an accessible phone summary", async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await page.goto("/speisekarte.html");
  const item = page.locator('[data-item-id="sushi-menues-200"]');
  const plus = item.locator(".qty-plus");
  await plus.click();
  await plus.click();
  await item.locator(".qty-minus").click();
  await expect(item.locator(".qty-value")).toHaveText("1");
  await expect(page.locator("#order-bar-summary")).toContainText("9,00 €");
  await page.getByLabel("Abendpreise").check();
  await expect(page.locator("#order-bar-summary")).toContainText("10,00 €");

  const openButton = page.locator("#order-bar-btn");
  await openButton.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator(".order-modal-close")).toBeFocused();
  await expect(page.locator("header")).toHaveAttribute("inert", "");
  await page.getByRole("button", { name: "Nein danke, weiter" }).click();
  await expect(dialog).toContainText("Ca. Gesamtsumme (Abend): 10,00 €");
  await expect(dialog).toContainText("Bestellung ausschließlich telefonisch");
  const callLink = dialog.getByRole("link", { name: "Jetzt anrufen", exact: true });
  await expect(callLink).toHaveAttribute("href", "tel:+498104888476");
  await expect(callLink).toHaveText("Jetzt anrufen");

  await page.evaluate(() => document.querySelector('[data-lang="en"]').click());
  await expect(dialog).toContainText("Approx. total (evening): 10,00 €");
  await expect(dialog).toContainText("orders are placed by phone only");
  await expect(dialog.getByRole("link", { name: "Call now", exact: true })).toBeVisible();
  await page.locator(".order-modal-close").focus();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: /Call now/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(openButton).toBeFocused();
  await expect(page.locator("header")).not.toHaveAttribute("inert", "");
  assertRuntime();
});

test("summary order follows the canonical menu, not click order", async ({ page }) => {
  await page.goto("/speisekarte.html");
  await page.locator('[data-item-id="sushi-menues-202"] .qty-plus').click();
  await page.locator('[data-item-id="sushi-menues-200"] .qty-plus').click();
  await page.locator("#order-bar-btn").click();
  await page.getByRole("button", { name: "Nein danke, weiter" }).click();
  await expect(page.locator(".order-summary-list .order-row-num")).toHaveText(["Nr. 200", "Nr. 202"]);
});

test("legacy, malformed, stale, and extreme carts are normalized", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("legacy-cart-seeded") === "true") return;
    sessionStorage.setItem("legacy-cart-seeded", "true");
    localStorage.setItem("chomchom-cart-v2", "{broken");
    localStorage.setItem("chomchom-cart", JSON.stringify({
      "200": { num: "200", name: "<img src=x onerror=alert(1)>", price: 0.01, category: "wrong", qty: 2 },
      missing: { num: "9999", name: "Missing", price: 999, category: "wrong", qty: 4 }
    }));
  });
  await page.goto("/speisekarte.html");
  await expect(page.locator('[data-item-id="sushi-menues-200"] .qty-value')).toHaveText("2");
  await expect(page.locator("#order-bar-summary")).toContainText("18,00 €");
  expect(await page.locator('img[src="x"]').count()).toBe(0);
  const migrated = await page.evaluate(() => ({
    current: JSON.parse(localStorage.getItem("chomchom-cart-v2")),
    legacy: localStorage.getItem("chomchom-cart")
  }));
  expect(migrated.current.items).toEqual({ "sushi-menues-200": 2 });
  expect(migrated.legacy).toBeNull();

  await page.evaluate(() => {
    localStorage.setItem("chomchom-cart-v2", JSON.stringify({
      version: 2,
      contentVersion: "old",
      items: { "sushi-menues-200": 999, "removed-item": 5, "sushi-menues-202": -2 }
    }));
  });
  await page.reload();
  await expect(page.locator('[data-item-id="sushi-menues-200"] .qty-value')).toHaveText("20");
  await expect(page.locator('[data-item-id="sushi-menues-200"] .qty-plus')).toBeDisabled();
  const normalized = await page.evaluate(() => JSON.parse(localStorage.getItem("chomchom-cart-v2")).items);
  expect(normalized).toEqual({ "sushi-menues-200": 20 });
});

test("suggestions resolve to live stable IDs and update the open modal", async ({ page }) => {
  await page.goto("/speisekarte.html");
  await page.locator('[data-item-id="sushi-menues-202"] .qty-plus').click();
  await page.locator("#order-bar-btn").click();
  const suggestions = page.locator("[data-suggest-id]");
  await expect(suggestions).toHaveCount(2);
  await expect(suggestions).toHaveText(["+ Mini-Frühlingsrollen", "+ Bananen-Dessert"]);
  expect(await suggestions.evaluateAll((chips) => chips.map((chip) => chip.dataset.suggestId))).toEqual([
    "vorspeisen-11",
    "desserts-80"
  ]);
  await page.evaluate(() => document.querySelector('[data-lang="en"]').click());
  await expect(suggestions).toHaveText(["+ Mini-Frühlingsrollen", "+ Banana dessert"]);
  const id = await suggestions.first().getAttribute("data-suggest-id");
  await suggestions.first().click();
  await expect(page.locator(`[data-item-id="${id}"] .qty-value`)).toHaveText("1");
});
