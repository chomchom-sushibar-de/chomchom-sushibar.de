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

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function summarize(samples) {
  return {
    performance: median(samples.map((sample) => sample.performance)),
    accessibility: Math.min(...samples.map((sample) => sample.accessibility)),
    bestPractices: Math.min(...samples.map((sample) => sample.bestPractices)),
    seo: Math.min(...samples.map((sample) => sample.seo)),
    largestContentfulPaintMs: median(samples.map((sample) => sample.largestContentfulPaintMs)),
    cumulativeLayoutShift: Math.max(...samples.map((sample) => sample.cumulativeLayoutShift)),
    totalByteWeight: Math.max(...samples.map((sample) => sample.totalByteWeight)),
    samples
  };
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
  await context.addInitScript(() => {
    localStorage.setItem("site-unlocked", "true");
    localStorage.setItem("chomchom-lang", "de");
    localStorage.setItem("chomchom-theme", "light");
  });

  const reports = {};
  const failures = [];
  for (const path of ["index.html", "speisekarte.html"]) {
    const samples = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await lighthouse(`${baseUrl}/${path}`, {
        port: chrome.port,
        logLevel: "error",
        output: "json",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"]
      });
      samples.push({
        performance: score(result, "performance"),
        accessibility: score(result, "accessibility"),
        bestPractices: score(result, "best-practices"),
        seo: score(result, "seo"),
        largestContentfulPaintMs: auditValue(result, "largest-contentful-paint"),
        cumulativeLayoutShift: auditValue(result, "cumulative-layout-shift"),
        totalByteWeight: auditValue(result, "total-byte-weight")
      });
    }
    const summary = summarize(samples);
    reports[path] = summary;
    if (summary.performance < 0.85) failures.push(`${path}: median Lighthouse performance ${summary.performance} is below 0.85.`);
    if (summary.accessibility < 0.95) failures.push(`${path}: Lighthouse accessibility ${summary.accessibility} is below 0.95.`);
    if (summary.bestPractices < 0.9) failures.push(`${path}: Lighthouse best practices ${summary.bestPractices} is below 0.90.`);
    if (summary.largestContentfulPaintMs > 4000) failures.push(`${path}: median LCP exceeds 4000 ms.`);
    if (summary.cumulativeLayoutShift > 0.1) failures.push(`${path}: worst-case CLS exceeds 0.1.`);
    if (summary.totalByteWeight > 5_000_000) failures.push(`${path}: worst-case transferred bytes exceed 5 MB.`);
  }
  await mkdir(resolve(root, "artifacts"), { recursive: true });
  await writeFile(resolve(root, "artifacts/lighthouse.json"), `${JSON.stringify(reports, null, 2)}\n`);
  console.log(JSON.stringify(reports, null, 2));
  await browser.close();
  if (failures.length > 0) throw new Error(failures.join("\n"));
} finally {
  if (chrome) await chrome.kill();
  server.kill("SIGTERM");
}
