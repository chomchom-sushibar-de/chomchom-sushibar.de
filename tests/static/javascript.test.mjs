import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

async function filesIn(directory, suffix) {
  const entries = await readdir(resolve(root, directory), { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(suffix)).map((entry) => resolve(root, directory, entry.name));
}

test("all delivered and build JavaScript has valid syntax", async () => {
  const publicScripts = (await readdir(root)).filter((name) => name.endsWith(".js")).map((name) => resolve(root, name));
  const buildScripts = [
    ...(await filesIn("scripts", ".mjs")),
    ...(await filesIn("scripts/lib", ".mjs"))
  ];
  const checked = [];
  for (const file of [...publicScripts, ...buildScripts]) {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    checked.push(file);
  }
  assert.ok(checked.length >= 8);
});
