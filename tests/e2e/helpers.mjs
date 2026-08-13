import { expect } from "@playwright/test";

export async function unlockPreview(page, options = {}) {
  const language = options.language || "de";
  const theme = options.theme || "light";
  await page.addInitScript(({ languageValue, themeValue }) => {
    if (sessionStorage.getItem("chomchom-test-seeded") === "true") return;
    localStorage.setItem("site-unlocked", "true");
    localStorage.setItem("chomchom-lang", languageValue);
    localStorage.setItem("chomchom-theme", themeValue);
    sessionStorage.setItem("chomchom-test-seeded", "true");
  }, { languageValue: language, themeValue: theme });
}

export function watchRuntime(page) {
  const failures = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173" && url.protocol !== "data:") failures.push(`external request: ${request.url()}`);
  });
  return () => expect(failures, failures.join("\n")).toEqual([]);
}
