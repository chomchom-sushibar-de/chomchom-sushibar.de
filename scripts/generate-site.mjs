import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSite } from "./lib/validate-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = resolve(root, "index.html");
const check = process.argv.includes("--check");
const scriptPattern = /(<script\s+type="application\/ld\+json"\s+id="restaurant-structured-data">)\s*[\s\S]*?(<\/script>)/;

const site = await validateSite(root);
const source = await readFile(htmlPath, "utf8");
const match = source.match(scriptPattern);
if (!match) throw new Error("index.html is missing #restaurant-structured-data.");

const currentJson = match[0]
  .slice(match[1].length, match[0].length - match[2].length)
  .trim();
const restaurant = JSON.parse(currentJson);
restaurant.openingHoursSpecification = [site.hours.weekday, site.hours.sundayHolidays]
  .flatMap((group) => group.periods.map((period) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: group.schemaDays,
    opens: period.opens,
    closes: period.closes
  })));

const generatedScript = `${match[1]}\n${JSON.stringify(restaurant, null, 2)}\n${match[2]}`;
const generated = source.replace(scriptPattern, generatedScript);

if (check) {
  if (generated !== source) {
    throw new Error("index.html structured opening hours are not synchronized with data/site.json; run npm run site:generate.");
  }
  console.log("Restaurant structured opening hours are synchronized with data/site.json.");
} else {
  await writeFile(htmlPath, generated);
  console.log("Generated restaurant structured opening hours from data/site.json.");
}
