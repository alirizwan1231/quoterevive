// QuoteRevive test runner.
// Compiles app/lib.ts with the project's own TypeScript into tests/.build/
// (gitignored), then runs the logic suite (44 assertions) and the extended
// suite against the compiled module — i.e. against the exact code the app
// ships, not a copy.
//
// Usage:  npm test        (or: node tests/run-tests.mjs)
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHarness } from "./harness.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = join(root, "tests", ".build");

rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
execFileSync(
  join(root, "node_modules", ".bin", "tsc"),
  ["app/lib.ts", "--outDir", buildDir, "--module", "es2022", "--target", "es2022",
   "--moduleResolution", "bundler", "--skipLibCheck", "--declaration", "false", "--sourceMap", "false"],
  { cwd: root, stdio: "inherit" }
);
writeFileSync(join(buildDir, "package.json"), JSON.stringify({ type: "module" }));

const lib = await import(pathToFileURL(join(buildDir, "lib.js")).href);

let totalPass = 0, totalFail = 0;
for (const [name, file] of [["Logic suite (44 assertions)", "./logic.test.mjs"], ["Extended suite", "./extended.test.mjs"]]) {
  const suite = (await import(new URL(file, import.meta.url))).default;
  const harness = createHarness(name);
  suite(lib, harness);
  const { pass, fail } = harness.report();
  totalPass += pass; totalFail += fail;
}

console.log(`\nTOTAL: ${totalPass}/${totalPass + totalFail} assertions passed`);
if (totalFail > 0) {
  console.error(`${totalFail} assertion(s) FAILED`);
  process.exit(1);
}
console.log("All tests passed.");
