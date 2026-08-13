import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = 4174;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["scripts/serve.mjs", "--port", String(port)], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch (error) {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error("Local server did not become ready for Lighthouse.");
}

function score(result, category) {
  return result.lhr.categories[category].score;
}

function auditValue(result, audit) {
  return result.lhr.audits[audit]?.numericValue;
}

let chrome;
try {
  await waitForServer();
  chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"]
  });
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
  const context = browser.contexts()[0];
  const setupPage = await context.newPage();
  await setupPage.goto(baseUrl);
  await setupPage.evaluate(() => localStorage.setItem("site-unlocked", "true"));
  await setupPage.close();

  const reports = {};
  for (const path of ["index.html", "speisekarte.html"]) {
    const result = await lighthouse(`${baseUrl}/${path}`, {
      port: chrome.port,
      logLevel: "error",
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      disableStorageReset: true
    });
    const summary = {
      performance: score(result, "performance"),
      accessibility: score(result, "accessibility"),
      bestPractices: score(result, "best-practices"),
      seo: score(result, "seo"),
      largestContentfulPaintMs: auditValue(result, "largest-contentful-paint"),
      cumulativeLayoutShift: auditValue(result, "cumulative-layout-shift"),
      totalByteWeight: auditValue(result, "total-byte-weight")
    };
    reports[path] = summary;
    if (summary.performance < 0.85) throw new Error(`${path}: Lighthouse performance ${summary.performance} is below 0.85.`);
    if (summary.accessibility < 0.95) throw new Error(`${path}: Lighthouse accessibility ${summary.accessibility} is below 0.95.`);
    if (summary.bestPractices < 0.9) throw new Error(`${path}: Lighthouse best practices ${summary.bestPractices} is below 0.90.`);
    if (summary.largestContentfulPaintMs > 4000) throw new Error(`${path}: LCP exceeds 4000 ms.`);
    if (summary.cumulativeLayoutShift > 0.1) throw new Error(`${path}: CLS exceeds 0.1.`);
    if (summary.totalByteWeight > 5_000_000) throw new Error(`${path}: transferred bytes exceed 5 MB.`);
  }
  await mkdir(resolve(root, "artifacts"), { recursive: true });
  await writeFile(resolve(root, "artifacts/lighthouse.json"), `${JSON.stringify(reports, null, 2)}\n`);
  console.log(JSON.stringify(reports, null, 2));
  await browser.close();
} finally {
  if (chrome) await chrome.kill();
  server.kill("SIGTERM");
}
