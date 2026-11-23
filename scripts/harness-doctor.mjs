import fs from "node:fs";
import net from "node:net";
import { execFileSync } from "node:child_process";
import { banner, c, section, statusLine, table } from "./lib/cli-ui.mjs";

const expected = fs.readFileSync(".nvmrc", "utf8").trim();
let failures = 0;

function report(ok, label, detail) {
  console.log(statusLine(ok ? "ok" : "error", label, detail));
  if (!ok) failures += 1;
}

console.log(banner("Harness Doctor", "Environment, lockfile, worktree & preview port checks"));
console.log(section("Runtime & Dependencies"));

report(process.version.slice(1) === expected, "Node.js", `${process.version} (expected ${expected})`);
report(
  fs.existsSync("node_modules/.package-lock.json"),
  "Dependencies",
  "node_modules lock present; run npm ci if missing",
);
report(fs.existsSync("package-lock.json"), "Lockfile", "package-lock.json present");

const toggles = ["PUBLIC_ENABLE_ANALYTICS", "PUBLIC_ENABLE_COMMENTS", "PUBLIC_ENABLE_SEARCH"];
console.log(section("Environment & Worktree"));
const envRows = toggles.map((key) => [c.cyan(key), process.env[key] ?? c.muted("(unset; project default)")]);

try {
  const changes = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { encoding: "utf8" });
  const count = changes.trim() ? changes.trimEnd().split("\n").length : 0;
  envRows.push([c.cyan("Tracked changes"), `${count} file(s) (preserve existing edits)`]);
} catch {
  envRows.push([c.cyan("Tracked changes"), c.muted("Git status unavailable")]);
}
console.log(table(envRows));
console.log(
  statusLine("info", "Verification policy", "Analytics/comments stay disabled; Baidu push is never invoked."),
);

const port = Number(process.env.HARNESS_PORT ?? 4339);
console.log(section("Preview Port"));
const server = net.createServer();
server.once("error", (error) => {
  report(false, "Preview port", `${port}: ${error.code ?? error.message}`);
  console.log("");
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  report(true, "Preview port", `127.0.0.1:${port} available`);
  console.log("");
  server.close(() => {
    process.exitCode = failures ? 1 : 0;
  });
});
