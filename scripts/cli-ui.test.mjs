import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { banner, displayWidth, formatDuration, stripAnsi } from "./lib/cli-ui.mjs";
import { inspectDevLock } from "./dev.mjs";

test("stripAnsi and displayWidth accurately measure ASCII, CJK, and styled text", () => {
  const plain = "astro-orbit · 双语博客";
  const colored = `\x1B[94mastro-orbit\x1B[39m · \x1B[1m双语博客\x1B[22m`;
  assert.equal(stripAnsi(colored), plain);
  assert.equal(displayWidth("abc"), 3);
  assert.equal(displayWidth("中文"), 4);
  assert.equal(displayWidth(colored), displayWidth(plain));
  assert.equal(displayWidth(plain), 14 + 8);
});

test("banner aligns every Unicode box line to identical displayWidth even with CJK subtitle", () => {
  const output = banner("命令总览", "Astro Orbit · 双语博客命令行工具");
  const lines = output.split("\n").map((line) => stripAnsi(line));
  assert.equal(lines.length, 4);
  const widths = lines.map((line) => displayWidth(line));
  assert.ok(
    widths.every((width) => width === widths[0]),
    `Misaligned widths: ${widths.join(",")}`,
  );
});

test("formatDuration formats milliseconds and seconds consistently", () => {
  assert.equal(formatDuration(-5), "0ms");
  assert.equal(formatDuration(42), "42ms");
  assert.equal(formatDuration(999.4), "999ms");
  assert.equal(formatDuration(1000), "1.00s");
  assert.equal(formatDuration(2345), "2.35s");
});

test("inspectDevLock classifies missing, invalid, stale, and running lockfiles", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "astro-orbit-lock-"));
  const lockFile = path.join(tempDir, "dev.json");
  try {
    assert.deepEqual(inspectDevLock(lockFile), { status: "none", lock: null });

    fs.writeFileSync(lockFile, "{invalid json", "utf8");
    assert.deepEqual(inspectDevLock(lockFile), { status: "invalid", lock: null });

    fs.writeFileSync(lockFile, JSON.stringify({ pid: "bad", url: "http://localhost:4321" }), "utf8");
    assert.deepEqual(inspectDevLock(lockFile), { status: "invalid", lock: null });

    const lockPayload = { pid: 60418, url: "http://localhost:4321", port: 4321, background: false, startedAt: "2026" };
    fs.writeFileSync(lockFile, JSON.stringify(lockPayload), "utf8");

    assert.deepEqual(
      inspectDevLock(lockFile, () => false),
      { status: "stale", lock: lockPayload },
    );
    assert.deepEqual(
      inspectDevLock(lockFile, () => true),
      { status: "running", lock: lockPayload },
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
