import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import {
  withCache,
  clearCache,
  clearAllCache,
  getCacheStats,
} from "../src/lib/cache-utils.ts";
import {
  readStorage,
  writeStorage,
  internalBackPath,
} from "../src/utils/browser-storage.ts";
import { createThemePreference } from "../src/utils/theme-preference.ts";
import { rehypeArticleImages } from "../src/utils/rehypeArticleImages.ts";
import { serializeJsonLd } from "../src/utils/serializeJsonLd.ts";

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const store = () => {
  let value = null;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    remove: () => {
      value = null;
    },
  };
};

test("cache coalesces in-flight loads and reuses fulfilled values", async () => {
  clearAllCache();
  const work = deferred();
  let loads = 0;
  const load = () => {
    ++loads;
    return work.promise;
  };
  const a = withCache("shared", load);
  const b = withCache("shared", load);
  await Promise.resolve();
  assert.equal(loads, 1);
  work.resolve({ value: 42 });
  assert.equal(await a, await b);
  assert.deepEqual(
    await withCache("shared", async () => assert.fail("must reuse")),
    { value: 42 },
  );
  assert.deepEqual(getCacheStats(), { size: 1, keys: ["shared"] });
});
test("TTL begins after loading completes and expired entries reload", async (t) => {
  clearAllCache();
  let now = 1000;
  t.mock.method(Date, "now", () => now);
  const work = deferred();
  const a = withCache("ttl", () => work.promise, 100);
  await Promise.resolve();
  now = 5000;
  work.resolve("loaded");
  await a;
  now = 5099;
  assert.equal(await withCache("ttl", async () => "too early"), "loaded");
  now = 5100;
  assert.equal(await withCache("ttl", async () => "fresh"), "fresh");
});
for (const clear of [clearCache, clearAllCache]) {
  test(`${clear.name}: an invalidated load cannot repopulate or overwrite a newer value`, async () => {
    clearAllCache();
    const work = deferred();
    const old = withCache("race", () => work.promise);
    await Promise.resolve();
    clear("race");
    assert.equal(await withCache("race", async () => "new"), "new");
    work.resolve("old");
    assert.equal(await old, "old");
    assert.equal(await withCache("race", async () => "wrong"), "new");
  });
}
test("a rejected stale request cannot evict newer data; errors retry", async () => {
  clearAllCache();
  const work = deferred();
  const old = withCache("reject", () => work.promise);
  const rejected = assert.rejects(old, /old failed/);
  await Promise.resolve();
  clearCache("reject");
  await withCache("reject", async () => "new");
  work.reject(new Error("old failed"));
  await rejected;
  assert.equal(await withCache("reject", async () => "wrong"), "new");
  await assert.rejects(
    withCache("retry", async () => {
      throw new Error("retry me");
    }),
    /retry me/,
  );
  assert.equal(await withCache("retry", async () => 7), 7);
});
test("zero TTL does not retain a fulfilled value", async () => {
  clearAllCache();
  await withCache("zero", async () => 1, 0);
  assert.equal(await withCache("zero", async () => 2, 0), 2);
});
test("storage handles denied access, denied methods and successful reads/writes", () => {
  const denied = () => {
    throw new Error("denied");
  };
  assert.equal(readStorage(denied, "key", "fallback"), "fallback");
  assert.equal(writeStorage(denied, "key", "x"), false);
  assert.equal(
    readStorage(() => ({ getItem: denied }), "key"),
    null,
  );
  assert.equal(
    writeStorage(() => ({ setItem: denied }), "key", "x"),
    false,
  );
  const storage = store();
  assert.equal(
    writeStorage(() => storage, "theme", "dark"),
    true,
  );
  assert.equal(
    readStorage(() => storage, "theme"),
    "dark",
  );
});
test("theme follows the system until explicitly selected; latest storage wins", () => {
  const storage = store();
  let dark = true;
  const theme = createThemePreference(
    () => storage,
    () => dark,
  );
  assert.equal(theme.get(), "dark");
  dark = false;
  assert.equal(theme.get(), "light");
  theme.select("dark");
  assert.equal(theme.get(), "dark");
  storage.setItem("theme", "light");
  assert.equal(theme.get(), "light");
  dark = true;
  storage.remove();
  theme.sync();
  assert.equal(theme.get(), "dark");
  storage.setItem("theme", "invalid");
  assert.equal(theme.get(), "dark");
});
test("denied writes retain an explicit theme even when reads still work", () => {
  const storage = {
    getItem: () => "light",
    setItem: () => {
      throw new Error("quota");
    },
  };
  const theme = createThemePreference(
    () => storage,
    () => false,
  );
  theme.select("dark");
  assert.equal(theme.get(), "dark");
  assert.equal(theme.get(), "dark");
});
test("denied storage property access never interrupts in-memory theme selection", () => {
  const theme = createThemePreference(
    () => {
      throw new Error("denied");
    },
    () => false,
  );
  assert.equal(theme.get(), "light");
  theme.select("dark");
  assert.equal(theme.get(), "dark");
});
test("back links preserve local route/query/hash and reject external or script URLs", () => {
  const origin = "https://blog.example";
  for (const value of [
    null,
    "",
    "https://other.example/",
    "//other.example/",
    "javascript:alert(1)",
    "data:text/html,test",
    "http://[",
  ])
    assert.equal(internalBackPath(value, origin), null, value);
  assert.equal(
    internalBackPath("/blog/?page=2#title", origin),
    "/blog/?page=2#title",
  );
  assert.equal(internalBackPath(origin + "/notes/", origin), "/notes/");
});
test("JSON-LD text cannot terminate the HTML script, and parsed data is unchanged", () => {
  const data = {
    title: "</ScRiPt><p>example</p>",
    text: '<!-- 中文 & "quote" -->',
    array: ["<", 42],
  };
  const json = serializeJsonLd(data);
  assert.equal(json.includes("<"), false);
  assert.deepEqual(JSON.parse(json), data);
  assert.deepEqual(JSON.parse(serializeJsonLd({})), {});
});

test("local article images reserve their actual dimensions without changing the published URL", async () => {
  const image = {
    type: "element",
    tagName: "img",
    properties: { src: "/blog/codeql-learning/01-codeql-architecture.png" },
    children: [],
  };
  const tree = { type: "root", children: [image] };
  const transform = rehypeArticleImages();
  await transform(tree);
  assert.equal(
    image.properties.src,
    "/blog/codeql-learning/01-codeql-architecture.png",
  );
  assert.equal(image.properties.width, 1408);
  assert.equal(image.properties.height, 768);
  assert.equal(image.properties.loading, "lazy");
  await transform(tree);
  assert.equal(tree.children[0], image);
});
test("image metadata respects authored dimensions and component-owned or remote images", async (t) => {
  t.mock.method(globalThis, "fetch", () =>
    assert.fail("never fetch remote metadata"),
  );
  const image = (src, extra = {}) => ({
    type: "element",
    tagName: "img",
    properties: { src, ...extra },
    children: [],
  });
  const authored = image("/blog/codeql-learning/01-codeql-architecture.png", {
    width: 352,
    height: 192,
  });
  const remote = image("https://example.test/image.png");
  const owned = image("/blog/codeql-learning/01-codeql-architecture.png");
  const tree = {
    type: "root",
    children: [
      authored,
      remote,
      {
        type: "element",
        tagName: "div",
        properties: { className: ["not-prose"] },
        children: [owned],
      },
    ],
  };
  await rehypeArticleImages()(tree);
  assert.equal(authored.properties.width, 352);
  assert.equal(authored.properties.height, 192);
  assert.deepEqual(remote.properties, {
    src: "https://example.test/image.png",
  });
  assert.deepEqual(owned.properties, {
    src: "/blog/codeql-learning/01-codeql-architecture.png",
  });
});
test("invalid/missing local metadata leaves URLs intact and responsive pictures stay idempotent", async () => {
  const sources = [
    "/blog/not-an-existing-image.png",
    "/blog/%xx.png",
    "/blog/../../package.json",
  ];
  const images = sources.map((src) => ({
    type: "element",
    tagName: "img",
    properties: { src },
    children: [],
  }));
  const responsive = {
    type: "element",
    tagName: "img",
    properties: { src: "/blog/l3hctf-best-profile/01-profile-bypass-flow.png" },
    children: [],
  };
  const tree = { type: "root", children: [...images, responsive] };
  const transform = rehypeArticleImages();
  await transform(tree);
  await transform(tree);
  assert.deepEqual(
    images.map((img) => img.properties.src),
    sources,
  );
  assert.equal(
    images.some((img) => img.properties.width),
    false,
  );
  assert.equal(tree.children.at(-1).tagName, "picture");
  assert.equal(
    tree.children.at(-1).children.filter((node) => node.tagName === "picture")
      .length,
    0,
  );
  assert.equal(tree.children.at(-1).children[1].properties.width, 3420);
});

test("production build invalidates cached Markdown so plugin changes reach published HTML", async () => {
  const config = JSON.parse(
    await fs.readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.match(config.scripts.build, /astro build --force/);
  assert.match(config.scripts["verify:full"], /npm run build/);
});
