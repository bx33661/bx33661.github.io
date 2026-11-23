import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { banner, c, panel, statusLine, table } from "./lib/cli-ui.mjs";

const ASTRO_BIN = path.resolve("node_modules/astro/bin/astro.mjs");
const DEFAULT_LOCK_PATH = path.resolve(".astro/dev.json");
const PASSTHROUGH_COMMANDS = new Set(["stop", "status", "logs", "--help", "-h"]);

function defaultIsAlive(pid) {
  if (pid === process.pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function inspectDevLock(lockPath = DEFAULT_LOCK_PATH, isAliveFn = defaultIsAlive) {
  if (!fs.existsSync(lockPath)) {
    return { status: "none", lock: null };
  }

  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  } catch {
    return { status: "invalid", lock: null };
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.pid !== "number" ||
    !Number.isInteger(parsed.pid) ||
    parsed.pid <= 0 ||
    typeof parsed.url !== "string"
  ) {
    return { status: "invalid", lock: null };
  }

  return isAliveFn(parsed.pid) ? { status: "running", lock: parsed } : { status: "stale", lock: parsed };
}

function spawnAstroDev(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [ASTRO_BIN, "dev", ...args], {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    const forward = (signal) => {
      if (!child.killed) child.kill(signal);
    };
    process.on("SIGINT", () => forward("SIGINT"));
    process.on("SIGTERM", () => forward("SIGTERM"));

    child.on("exit", (code, signal) => {
      if (signal) resolve(1);
      else resolve(code ?? 0);
    });
  });
}

function printDevTips(url) {
  console.log("");
  console.log(
    table([
      [c.cyan("npm run dev:force"), "接管并重启当前开发服务器 (--force)"],
      [c.cyan("npm run dev:stop"), "停止当前运行中的开发服务器"],
      [c.cyan("npm run dev:status"), "查看当前端口与服务器状态"],
      ...(url ? [[c.cyan("Open URL"), url]] : []),
    ]),
  );
  console.log("");
}

async function promptConflictAction() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(
      `\n  ${c.bold("选择操作")}: [y] 接管重启 (--force) / [s] 停止旧服务 / [N] 保持运行: `,
    );
    return answer.trim().toLowerCase();
  } finally {
    rl.close();
  }
}

async function main() {
  const userArgs = process.argv.slice(2);
  const firstArg = userArgs[0] ?? "";

  if (PASSTHROUGH_COMMANDS.has(firstArg)) {
    console.log(`${c.brand("✦ astro-orbit")} ${c.dim("·")} ${c.bold(`dev ${firstArg.replace(/^--/, "")}`)}\n`);
    process.exitCode = await spawnAstroDev(userArgs);
    return;
  }

  const bypassLock = userArgs.includes("--force") || userArgs.includes("--ignore-lock");
  if (!bypassLock) {
    const { status, lock } = inspectDevLock(DEFAULT_LOCK_PATH);

    if (status === "stale" || status === "invalid") {
      try {
        fs.unlinkSync(DEFAULT_LOCK_PATH);
        console.log(
          statusLine(
            "info",
            "Cleaned stale lock",
            lock?.pid ? `Removed expired .astro/dev.json (PID ${lock.pid})` : "Removed invalid .astro/dev.json",
          ),
        );
      } catch {
        /* Ignore lock removal race. */
      }
    } else if (status === "running" && lock) {
      console.log(banner("Dev Server", "Astro 7 · Local development environment"));
      console.log("");
      console.log(
        panel(
          "Dev Server Already Running",
          [`URL     ${lock.url}`, `PID     ${lock.pid}`, ...(lock.startedAt ? [`Started ${lock.startedAt}`] : [])],
          "warn",
        ),
      );

      if (process.stdin.isTTY && process.stdout.isTTY) {
        const choice = await promptConflictAction();
        if (choice === "y" || choice === "yes" || choice === "r") {
          console.log(statusLine("next", "Restarting", "Replacing running dev server with --force"));
          process.exitCode = await spawnAstroDev(["--force", ...userArgs]);
          return;
        }
        if (choice === "s" || choice === "stop") {
          console.log(statusLine("next", "Stopping", "Shutting down existing dev server"));
          process.exitCode = await spawnAstroDev(["stop"]);
          return;
        }
      }

      printDevTips(lock.url);
      process.exitCode = 0;
      return;
    }
  }

  console.log(banner("Dev Server", "Astro 7 · Local development environment"));
  console.log("");
  process.exitCode = await spawnAstroDev(userArgs);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(statusLine("error", "Dev CLI failed", error instanceof Error ? error.message : String(error)));
    process.exit(1);
  });
}
