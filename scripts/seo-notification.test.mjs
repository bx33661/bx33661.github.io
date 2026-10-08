import test from "node:test";
import assert from "node:assert/strict";
import {
  contentFingerprint,
  notificationDelta,
  requireBaiduSuccess,
  normalizeBaiduSite,
  baiduPushBudget,
  isBaiduQuotaExhausted,
} from "./seo-notification-state.mjs";
import { submitIndexNow } from "./indexnow-push.mjs";
const html = (description, asset = "a.js") =>
  `<title>Test</title><meta name="description" content="${description}"><main><p>Core content</p><script src="${asset}"></script></main>`;
test("summary changes trigger notification but bundled scripts do not", () => {
  assert.notEqual(
    contentFingerprint(html("old")),
    contentFingerprint(html("new")),
  );
  assert.equal(
    contentFingerprint(html("old")),
    contentFingerprint(html("old", "b.js")),
  );
  assert.throws(() => contentFingerprint("<h1>error</h1>"), /Missing main/);
});
test("delta separates new, updated, unchanged and deleted URLs", () => {
  assert.deepEqual(
    notificationDelta({ a: "1", b: "2", c: "3" }, { a: "1", b: "old", d: "4" }),
    { changed: ["b", "c"], deleted: ["d"] },
  );
});
test("Baidu API errors and partial batches never count as full success", () => {
  requireBaiduSuccess({ success: 2 }, 2);
  for (const r of [
    { success: 1 },
    { error: 401 },
    { success: 2, not_valid: ["x"] },
  ])
    assert.throws(() => requireBaiduSuccess(r, 2));
});
test("IndexNow confirms published key and emits protocol payload", async () => {
  const calls = [];
  const key = "fixture-key-123";
  await submitIndexNow({
    site: "https://example.com",
    key,
    urls: ["https://example.com/post/"],
    fetcher: async (url, opts) => {
      calls.push([url, opts]);
      return calls.length === 1
        ? new Response(key)
        : new Response("", { status: 200 });
    },
  });
  const body = JSON.parse(calls[1][1].body);
  assert.equal(body.host, "example.com");
  assert.equal(body.keyLocation, "https://example.com/indexnow-key.txt");
  assert.deepEqual(body.urlList, ["https://example.com/post/"]);
});
test("IndexNow rejection and key mismatch fail before cache advance", async () => {
  for (const status of [403, 429])
    await assert.rejects(
      submitIndexNow({
        site: "https://example.com",
        key: "fixture-key-123",
        urls: ["https://example.com/post/"],
        fetcher: async (url) =>
          url.endsWith(".txt")
            ? new Response("fixture-key-123")
            : new Response("", { status }),
      }),
      /not confirmed/,
    );
  await assert.rejects(
    submitIndexNow({
      site: "https://example.com",
      key: "fixture-key-123",
      urls: ["https://example.com/post/"],
      fetcher: async () => new Response("wrong"),
    }),
    /did not match/,
  );
});
test("IndexNow rejects foreign origins without a network request", async () => {
  await assert.rejects(
    submitIndexNow({
      site: "https://example.com",
      key: "fixture-key-123",
      urls: ["https://other.com/post/"],
      fetcher: () => {
        throw new Error("network called");
      },
    }),
    /origin/,
  );
});

test("Baidu site retains the registered HTTPS resource prefix", () => {
  assert.equal(
    normalizeBaiduSite("https://www.example.com/"),
    "https://www.example.com",
  );
  assert.equal(
    normalizeBaiduSite("www.example.com"),
    "https://www.example.com",
  );
  assert.throws(() => normalizeBaiduSite("https://example.com/path/"));
});

test("IndexNow 202 is accepted pending validation, not confirmed for caching", async () => {
  const result = await submitIndexNow({
    site: "https://example.com",
    key: "fixture-key-123",
    urls: ["https://example.com/post/"],
    fetcher: async (url) =>
      url.endsWith(".txt")
        ? new Response("fixture-key-123")
        : new Response("", { status: 202 }),
  });
  assert.deepEqual(result, { confirmed: false });
});

test("Baidu quota exhaustion is distinguished from invalid site errors", () => {
  assert.equal(
    isBaiduQuotaExhausted({ error: 400, message: "over quota" }),
    true,
  );
  assert.equal(
    isBaiduQuotaExhausted({ error: 400, message: "site init fail" }),
    false,
  );
  assert.equal(
    isBaiduQuotaExhausted({ error: 401, message: "token invalid" }),
    false,
  );
});
test("Baidu run budget is bounded and rejects invalid values", () => {
  assert.equal(baiduPushBudget(), 10);
  assert.equal(baiduPushBudget("9"), 9);
  for (const x of [0, -1, 2001, "NaN", 1.5])
    assert.throws(() => baiduPushBudget(x));
});
