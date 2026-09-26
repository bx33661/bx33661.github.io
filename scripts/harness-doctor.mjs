import fs from "node:fs";
import net from "node:net";
import { execFileSync } from "node:child_process";

const expected = fs.readFileSync(".nvmrc", "utf8").trim();
let failures = 0;
function report(ok, label, detail) {
  console.log(`${ok ? "[OK]" : "[FAIL]"} ${label}: ${detail}`);
  if (!ok) failures += 1;
}

report(process.version.slice(1) === expected, "Node", `${process.version} (expected ${expected})`);
report(fs.existsSync("node_modules/.package-lock.json"), "dependencies", "node_modules lock present; use npm ci if missing");
report(fs.existsSync("package-lock.json"), "lockfile", "package-lock.json");

const toggles = ["PUBLIC_ENABLE_ANALYTICS", "PUBLIC_ENABLE_COMMENTS", "PUBLIC_ENABLE_SEARCH"];
for (const key of toggles) {
  console.log(`[INFO] ${key}=${process.env[key] ?? "(unset; project default)"}`);
}
console.log("[INFO] Local verification sets analytics/comments off; Baidu push is never called by verify scripts.");

try {
  const changes = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { encoding: "utf8" });
  const count = changes.trim() ? changes.trimEnd().split("\n").length : 0;
  console.log(`[INFO] tracked worktree changes: ${count} (preserve existing edits)`);
} catch {
  console.log("[INFO] Git status unavailable");
}

const port = Number(process.env.HARNESS_PORT ?? 4339);
const server = net.createServer();
server.once("error", (error) => {
  report(false, "preview port", `${port}: ${error.code ?? error.message}`);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  report(true, "preview port", `${port} available`);
  server.close(() => { process.exitCode = failures ? 1 : 0; });
});
