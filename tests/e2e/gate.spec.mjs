import { expect, test } from "@playwright/test";
import { watchRuntime } from "./helpers.mjs";

test("preview gate blocks presentation, reports errors, and persists unlock", async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await page.goto("/index.html");
  const gate = page.getByRole("dialog", { name: "Diese Seite ist noch in Arbeit." });
  await expect(gate).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-locked", "true");
  await expect(page.getByLabel("PIN")).toBeFocused();
  await page.getByLabel("PIN").fill("00000");
  await page.getByRole("button", { name: "Freischalten" }).click();
  await expect(page.getByRole("alert")).toContainText("Falsche PIN");
  await page.getByLabel("PIN").fill("82054");
  await page.getByRole("button", { name: "Freischalten" }).click();
  await expect(gate).toBeHidden();
  await expect(page.locator("main")).toBeFocused();
  await page.reload();
  await expect(page.locator(".pin-gate")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  assertRuntime();
});

test("preview gate follows the stored English preference", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("chomchom-lang", "en"));
  await page.goto("/kontakt.html");
  await expect(page.getByRole("dialog", { name: "This website is still in progress." })).toBeVisible();
});
