import { spawnSync } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", stdio: "inherit" });
  return result.status === 0;
}

async function absent(path) {
  try {
    await access(resolve(root, path));
    return false;
  } catch (error) {
    return error.code === "ENOENT";
  }
}

const automatedTests = run("npm", ["test"]);
const lighthouseBudgets = automatedTests && run("npm", ["run", "lighthouse"]);
const build = lighthouseBudgets && run("npm", ["run", "build"]);
const report = {
  generatedAt: new Date().toISOString(),
  technical: {
    automatedTests,
    lighthouseBudgets,
    staticBuild: build,
    previewGatePresent: !(await absent("gate.js")),
    noCname: await absent("CNAME"),
    status: "pending"
  },
  external: {
    operatorApproval: "blocked",
    currentMenuAndPrices: "blocked",
    openingHours: "blocked",
    imageApprovals: "blocked",
    domainAndDns: "blocked",
    decapAuthProductionRuntime: "blocked",
    physicalMobileDevices: "blocked"
  }
};
report.technical.status = Object.entries(report.technical)
  .filter(([key]) => key !== "status")
  .every(([, value]) => value === true) ? "ready" : "failed";
await mkdir(resolve(root, "artifacts"), { recursive: true });
await writeFile(resolve(root, "artifacts/release-readiness.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.technical.status !== "ready") process.exitCode = 1;
