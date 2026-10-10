import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { mergeBaiduLedger, migrateLedger } from "./merge-baidu-ledger.mjs";
import {
  contentFingerprint,
  notificationDelta,
} from "./seo-notification-state.mjs";

test("migration combines accepted versions, not pushed URLs or stale versions", () => {
  const current = { a: "new", b: "same", c: "new", d: "new" };
  const merged = mergeBaiduLedger(
    { fingerprints: { a: "old", b: "same", deleted: "x" }, pushed: ["d"] },
    { fingerprints: { a: "new", c: "old" } },
    current,
  );
  assert.deepEqual(merged.fingerprints, { a: "new", b: "same" });
  assert.equal(merged.ledgerVersion, 1);
  assert.deepEqual(notificationDelta(current, merged.fingerprints).changed, [
    "c",
    "d",
  ]);
});
test("migration is idempotent and the durable ledger supersedes legacy cache", () => {
  const current = { a: "1", b: "2" };
  const migrated = mergeBaiduLedger({}, { fingerprints: { a: "1" } }, current);
  assert.deepEqual(
    mergeBaiduLedger(migrated, { fingerprints: { b: "2" } }, current),
    migrated,
  );
});
test("changed and deleted pages stay eligible or are pruned across callers", () => {
  const base = { ledgerVersion: 1, fingerprints: { a: "1", deleted: "x" } };
  const merged = mergeBaiduLedger(base, {}, { a: "2", b: "1" });
  assert.deepEqual(merged.fingerprints, {});
  const accepted = { ...merged, fingerprints: { a: "2" } };
  assert.deepEqual(
    mergeBaiduLedger(accepted, {}, { a: "2", b: "1" }).fingerprints,
    { a: "2" },
  );
});
test("file migration tolerates an absent old cache and fails closed on corrupt JSON", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "baidu-ledger-"));
  try {
    const html =
      '<title>Test</title><meta name="description" content="Core"><main>Core</main>';
    const url = "https://www.bx33661.com/blog/test/";
    await fs.mkdir(path.join(dir, "dist/blog/test"), { recursive: true });
    await fs.writeFile(path.join(dir, "dist/blog/test/index.html"), html);
    await fs.writeFile(
      path.join(dir, "dist/sitemap.xml"),
      `<urlset><url><loc>${url}</loc></url></urlset>`,
    );
    const base = path.join(dir, "base.json"),
      ledger = path.join(dir, "ledger.json");
    await fs.writeFile(
      base,
      JSON.stringify({ fingerprints: { [url]: contentFingerprint(html) } }),
    );
    assert.deepEqual(
      await migrateLedger(base, ledger, path.join(dir, "dist")),
      { acknowledged: 1, queued: 0 },
    );
    const before = await fs.readFile(ledger, "utf8");
    await fs.writeFile(base, "{broken");
    await assert.rejects(
      migrateLedger(base, ledger, path.join(dir, "dist")),
      SyntaxError,
    );
    assert.equal(await fs.readFile(ledger, "utf8"), before);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
test("both workflows use one locked durable writer without CI feedback loops", async () => {
  const shared = await fs.readFile(
    ".github/workflows/baidu-notify.yml",
    "utf8",
  );
  for (const file of [
    ".github/workflows/deploy.yml",
    ".github/workflows/seo-daily.yml",
  ]) {
    const source = await fs.readFile(file, "utf8");
    assert.match(source, /uses: \.\/\.github\/workflows\/baidu-notify\.yml/);
    assert.doesNotMatch(source, /git add \.baidu-push-cache/);
  }
  assert.match(shared, /group: baidu-published-ledger/);
  assert.match(shared, /cancel-in-progress: false/);
  assert.match(shared, /ref: main/);
  assert.match(shared, /run: npm ci/);
  assert.match(shared, /\[skip ci\]/);
  assert.match(shared, /always\(\) && steps.prepare.outcome == 'success'/);
  assert.doesNotMatch(shared, /actions\/cache\/save/);
  const push = await fs.readFile("scripts/baidu-push.mjs", "utf8");
  assert.match(push, /await writeCache\(\{\s*\.\.\.cache,/);
});
test("blog and notes list descriptions are distinct and explicit", async () => {
  const blog = await fs.readFile("src/pages/blog/[...page].astro", "utf8");
  const notes = await fs.readFile("src/pages/notes.astro", "utf8");
  const description = (source) =>
    source.match(/<Layout[\s\S]*?description="([^"]+)"/)?.[1];
  assert.ok(description(blog));
  assert.ok(description(notes));
  assert.notEqual(description(blog), description(notes));
});

test("two sequential callers preserve durable version and never resend accepted content", async () => {
  const { spawnSync } = await import("node:child_process");
  // Put the fixture inside the repository so dotenv resolves without installing dependencies.
  await fs.mkdir(".tmp", { recursive: true });
  const dir = await fs.mkdtemp(path.resolve(".tmp/baidu-callers-"));
  try {
    await fs.mkdir(path.join(dir, "scripts"), { recursive: true });
    for (const file of ["baidu-push.mjs", "seo-notification-state.mjs"]) {
      await fs.copyFile(
        path.join("scripts", file),
        path.join(dir, "scripts", file),
      );
    }
    const html =
      '<title>Fixture</title><meta name="description" content="Core"><main>Core</main>';
    const url = "https://www.bx33661.com/blog/fixture/";
    await fs.mkdir(path.join(dir, "dist/blog/fixture"), { recursive: true });
    await fs.writeFile(path.join(dir, "dist/blog/fixture/index.html"), html);
    await fs.writeFile(
      path.join(dir, "dist/sitemap.xml"),
      `<urlset><url><loc>${url}</loc></url></urlset>`,
    );
    await fs.writeFile(
      path.join(dir, ".baidu-push-cache.json"),
      JSON.stringify({ ledgerVersion: 1, fingerprints: {}, pushed: [] }),
    );
    const loader = path.join(dir, "mock.mjs");
    await fs.writeFile(
      loader,
      `globalThis.fetch = async () => {
      if (process.env.MOCK_RESULT === "unexpected") throw new Error("duplicate notification");
      const quota = process.env.MOCK_RESULT === "quota";
      return new Response(JSON.stringify(quota
        ? {error:400,message:"quota exhausted"} : {success:1,remain:9}),
        {status:quota ? 400 : 200});
    };`,
    );
    const run = (result) =>
      spawnSync(
        process.execPath,
        [
          "--import",
          loader,
          path.join(dir, "scripts/baidu-push.mjs"),
          "--require-config",
        ],
        {
          cwd: dir,
          env: {
            ...process.env,
            BAIDU_PUSH_SITE: "https://www.bx33661.com",
            BAIDU_PUSH_TOKEN: "fixture-token",
            MOCK_RESULT: result,
          },
          encoding: "utf8",
        },
      );
    const quota = run("quota");
    assert.equal(quota.status, 0, quota.stderr);
    let cache = JSON.parse(
      await fs.readFile(path.join(dir, ".baidu-push-cache.json"), "utf8"),
    );
    assert.equal(cache.ledgerVersion, 1);
    assert.deepEqual(cache.fingerprints, {});
    const accepted = run("accepted");
    assert.equal(accepted.status, 0, accepted.stderr);
    assert.match(accepted.stdout, /success=1, failed=0, queued=0/);
    cache = JSON.parse(
      await fs.readFile(path.join(dir, ".baidu-push-cache.json"), "utf8"),
    );
    assert.equal(cache.ledgerVersion, 1);
    assert.equal(cache.fingerprints[url], contentFingerprint(html));
    const repeated = run("unexpected");
    assert.equal(repeated.status, 0, repeated.stderr);
    assert.match(repeated.stdout, /No new URLs to push/);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
