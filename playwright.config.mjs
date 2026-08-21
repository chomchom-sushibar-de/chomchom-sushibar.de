import { defineConfig } from "@playwright/test";

const projects = [
  { name: "mobile-narrow", use: { viewport: { width: 320, height: 568 } } },
  { name: "iphone", use: { viewport: { width: 390, height: 844 } } },
  { name: "android", use: { viewport: { width: 412, height: 915 } } },
  { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
  { name: "desktop", use: { viewport: { width: 1440, height: 900 } } }
];

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  expect: {
    timeout: 8_000,
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.015
    }
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    colorScheme: "light",
    locale: "de-DE",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects,
  webServer: {
    command: "npm run serve -- --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
