import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { chromium } from "playwright";

export const VIEWPORTS = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
];

export const THEMES = ["light", "dark"];

const MAC_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function launchBrowser(options = {}) {
  const executablePath = process.platform === "darwin" && fs.existsSync(MAC_CHROME_PATH) ? MAC_CHROME_PATH : undefined;
  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    ...options,
  });
}

export async function measureHorizontalOverflow(page) {
  return page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
}

export async function assertNoOverflow(page, label) {
  const { viewport, content } = await measureHorizontalOverflow(page);
  assert.ok(content <= viewport + 2, `${label}: horizontal overflow ${content}>${viewport}`);
}

export async function withPreviewServer(
  { port, baseUrl, readyPath = "/", env = {}, timeoutAttempts = 100, ignoreStdio = false },
  task,
) {
  const resolvedBase = (baseUrl || `http://127.0.0.1:${port}`).replace(/\/$/, "");
  if (baseUrl) {
    return task({ base: resolvedBase, getServerExit: () => "external", getServerOutput: () => "" });
  }

  let serverOutput = "";
  let serverExit = "running";
  const server = spawn(
    process.execPath,
    ["node_modules/astro/bin/astro.mjs", "preview", "--ignore-lock", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      env: { ...process.env, PUBLIC_ENABLE_ANALYTICS: "false", PUBLIC_ENABLE_COMMENTS: "false", ...env },
      stdio: ignoreStdio ? "ignore" : ["ignore", "pipe", "pipe"],
    },
  );

  if (!ignoreStdio) {
    server.stdout.on("data", (chunk) => {
      serverOutput += chunk.toString();
    });
    server.stderr.on("data", (chunk) => {
      serverOutput += chunk.toString();
    });
  }
  server.on("exit", (code, signal) => {
    serverExit = `${code ?? "null"}/${signal ?? "none"}`;
  });

  const stopServer = () => {
    if (!server.pid) return;
    try {
      server.kill("SIGTERM");
    } catch {
      /* Already stopped. */
    }
  };

  const onSignal = () => {
    stopServer();
    process.exit(1);
  };
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, onSignal);

  try {
    let ready = false;
    for (let attempt = 0; attempt < timeoutAttempts; attempt++) {
      if (serverExit !== "running") {
        throw new Error(`preview exited with ${serverExit}: ${serverOutput.slice(-500)}`);
      }
      try {
        if ((await fetch(`${resolvedBase}${readyPath}`)).ok) {
          ready = true;
          break;
        }
      } catch {
        /* Server is still starting. */
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready) {
      throw new Error(`preview did not start at ${resolvedBase}${readyPath}: ${serverOutput.slice(-500)}`);
    }

    return await task({
      base: resolvedBase,
      getServerExit: () => serverExit,
      getServerOutput: () => serverOutput,
    });
  } finally {
    for (const signal of ["SIGINT", "SIGTERM"]) process.off(signal, onSignal);
    stopServer();
  }
}
