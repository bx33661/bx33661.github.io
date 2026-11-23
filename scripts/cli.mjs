import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { banner, c, panel, section, statusLine, table } from "./lib/cli-ui.mjs";
import { walkMarkdownFiles } from "./lib/content-utils.mjs";

const COMMAND_MAP = {
  dev: ["scripts/dev.mjs"],
  "dev:force": ["scripts/dev.mjs", "--force"],
  "dev:stop": ["scripts/dev.mjs", "stop"],
  "dev:status": ["scripts/dev.mjs", "status"],
  new: ["scripts/content-new.mjs"],
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
  smoke: "smoke:source",
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

  console.log(section("Development"));
  console.log(
    table([
      [c.cyan("npm run dev"), "启动本地开发服务器（智能处理重复实例与锁文件）"],
      [c.cyan("npm run dev:force"), "强制替换已运行实例并启动开发服务器"],
      [c.cyan("npm run dev:stop / status"), "停止或查看运行中的开发服务器"],
      [c.cyan("npm run build / preview"), "生产构建 + Pagefind 全文索引 / 本地预览"],
    ]),
  );

  console.log(section("Authoring"));
  console.log(
    table([
      [c.cyan("npm run content:new"), "新建文章或笔记草稿（不加参数进入交互向导）"],
      [c.cyan("npm run content:check"), "校验 Frontmatter、slug 唯一性与本地图片"],
      [c.cyan("npm run gallery:optimize"), "生成 AVIF / WebP / JPG 多尺寸画廊图片"],
    ]),
  );

  console.log(section("Verification & Template"));
  console.log(
    table([
      [c.cyan("npm run harness:doctor"), "检查 Node 版本、依赖、工作区变更与预览端口"],
      [c.cyan("npm run template:check"), "审计 Fork 模板个性化定制项（支持 --strict）"],
      [c.cyan("npm run verify:quick"), "ESLint + astro check + 单元测试 + 源码与内容检查"],
      [c.cyan("npm run verify:full"), "完整构建 + 产物校验 + 全站视觉与浏览器回归"],
    ]),
  );

  console.log("");
  console.log(c.muted("  Quick dispatch: npm run cli -- <dev|new|doctor|check|verify|build|template> [...args]\n"));
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
