import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { banner, c, panel, section, statusLine, table } from "./lib/cli-ui.mjs";
import { walkMarkdownFiles } from "./lib/content-utils.mjs";

const COMMAND_MAP = {
  setup: ["scripts/setup.mjs"],
  dev: ["scripts/dev.mjs"],
  "dev:force": ["scripts/dev.mjs", "--force"],
  "dev:stop": ["scripts/dev.mjs", "stop"],
  "dev:status": ["scripts/dev.mjs", "status"],
  new: ["scripts/content-new.mjs"],
  "clean:demo": ["scripts/clean-demo.mjs"],
  doctor: ["scripts/harness-doctor.mjs"],
  check: ["scripts/content-check.mjs"],
  template: ["scripts/template-check.mjs"],
};

const NPM_SCRIPT_MAP = {
  verify: "verify:quick",
  "verify:quick": "verify:quick",
  "verify:full": "verify:full",
  build: "build",
  format: "format",
  preview: "preview",
  smoke: "smoke:dist",
};

function countEntries(dir) {
  if (!fs.existsSync(dir)) return 0;
  return walkMarkdownFiles(dir).length;
}

function readPackageMeta() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));
    return { name: pkg.name ?? "astro-orbit", version: pkg.version ?? "1.0.0" };
  } catch {
    return { name: "astro-orbit", version: "1.0.0" };
  }
}

function runProcess(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: process.cwd(), stdio: "inherit", shell: process.platform === "win32" });
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

function printOverview() {
  const pkg = readPackageMeta();
  const blogCount = countEntries(path.resolve("src/content/blog"));
  const noteCount = countEntries(path.resolve("src/data/notes"));
  const galleryCount = countEntries(path.resolve("src/data/galleries"));

  console.log(
    banner(`CLI Toolkit (${pkg.name})`, `v${pkg.version} · Bilingual Astro 7 Blog & Knowledge Base Template`),
  );
  console.log("");
  console.log(
    `  ${c.dim("Node")} ${c.bold(process.version)}   ${c.dim("·")}   ${c.dim("Blog")} ${c.cyan(String(blogCount))}   ${c.dim("·")}   ${c.dim("Notes")} ${c.cyan(String(noteCount))}   ${c.dim("·")}   ${c.dim("Galleries")} ${c.cyan(String(galleryCount))}`,
  );

  console.log(section("Setup & Development"));
  console.log(
    table([
      [c.cyan("npm run setup"), "Interactive wizard to configure title, author, URL, and languages"],
      [c.cyan("npm run dev"), "Start local dev server with lockfile & duplicate-process guard"],
      [c.cyan("npm run dev:force / stop"), "Take over existing port or stop background dev server"],
      [c.cyan("npm run build / preview"), "Build static dist/ + Pagefind index, or preview locally"],
    ]),
  );

  console.log(section("Authoring"));
  console.log(
    table([
      [c.cyan("npm run content:new"), "Create a new blog post or note draft (interactive if no args)"],
      [c.cyan("npm run content:check"), "Validate frontmatter, slug uniqueness, and local image paths"],
      [c.cyan("npm run clean:demo"), "Remove starter demo posts, notes, and demo gallery assets"],
      [c.cyan("npm run gallery:optimize"), "Generate responsive AVIF / WebP / JPG gallery renditions"],
    ]),
  );

  console.log(section("Verification & Template"));
  console.log(
    table([
      [c.cyan("npm run harness:doctor"), "Check Node version, dependencies, worktree, and preview port"],
      [c.cyan("npm run template:check"), "Audit placeholder defaults before deployment (--strict for CI)"],
      [c.cyan("npm run verify:quick"), "ESLint + astro check + unit tests + content check"],
      [c.cyan("npm run verify:full"), "Full quick checks + production build + dist smoke verification"],
    ]),
  );

  console.log("");
  console.log(c.muted("  Quick dispatch: npm run cli -- <setup|dev|new|doctor|check|verify|build|template> [...args]\n"));
}

async function main() {
  const [sub, ...rest] = process.argv.slice(2);
  if (!sub || sub === "--help" || sub === "-h" || sub === "help") {
    printOverview();
    return;
  }

  if (Object.prototype.hasOwnProperty.call(COMMAND_MAP, sub)) {
    const [scriptPath, ...presetArgs] = COMMAND_MAP[sub];
    process.exitCode = await runProcess(process.execPath, [scriptPath, ...presetArgs, ...rest]);
    return;
  }

  if (Object.prototype.hasOwnProperty.call(NPM_SCRIPT_MAP, sub)) {
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    const scriptName = NPM_SCRIPT_MAP[sub];
    const passArgs = rest.length ? ["--", ...rest] : [];
    process.exitCode = await runProcess(npmCmd, ["run", scriptName, ...passArgs]);
    return;
  }

  console.log(panel("Unknown CLI Subcommand", [`Subcommand "${sub}" is not registered.`], "error"));
  printOverview();
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(statusLine("error", "CLI error", error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
