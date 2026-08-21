import { access, cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
const files = [
  "404-base.js",
  "404.html",
  "aussenbereich.html",
  "datenschutz.html",
  "gate.js",
  "i18n.js",
  "impressum.html",
  "index.html",
  "kontakt.html",
  "order.js",
  "robots.txt",
  "script.js",
  "speisekarte.html",
  "styles.css"
];
const directories = ["admin", "data", "img", "menu"];

try {
  await access(resolve(root, "CNAME"));
  throw new Error("CNAME is forbidden while the domain decision is externally blocked.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) await cp(resolve(root, file), resolve(output, file));
for (const directory of directories) await cp(resolve(root, directory), resolve(output, directory), { recursive: true });
console.log(`Built static deployment artifact in ${output}.`);
