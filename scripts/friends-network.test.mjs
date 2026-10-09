import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/utils/friendInteractions.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture({ reduced = false, coarse = false, missing = false } = {}) {
  const styles = new Map();
  const frames = new Map();
  const motion = Object.assign(new EventTarget(), { matches: reduced });
  const fine = Object.assign(new EventTarget(), { matches: !coarse });
  let id = 0;
  class Element {
    closest() { return card; }
  }
  const card = Object.assign(new Element(), {
    style: { setProperty: (key, value) => styles.set(key, value), removeProperty: (key) => styles.delete(key) },
    getBoundingClientRect: () => ({ left: 100, top: 100 }),
  });
  const root = Object.assign(new EventTarget(), { contains: (node) => node === card });
  const exports = {};
  vm.runInNewContext(code, {
    exports, AbortController, Element,
    document: { querySelector: () => missing ? null : root },
    matchMedia: (query) => query.includes("reduced") ? motion : fine,
    requestAnimationFrame: (callback) => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: (key) => frames.delete(key),
  });
  const cleanup = exports.mountFriendInteractions();
  return { styles, frames, cleanup, motion, fine,
    move(x, y, pointerType = "mouse", target = card) {
      const event = Object.assign(new Event("pointermove"), { clientX: x, clientY: y, pointerType });
      Object.defineProperty(event, "target", { value: target }); root.dispatchEvent(event);
    },
    tick() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback()); },
    leave() { root.dispatchEvent(new Event("pointerleave")); },
  };
}

test("directory glow coalesces pointer events into one frame and uses latest local coordinates", () => {
  const f = fixture(); f.move(140, 150); f.move(160, 180);
  assert.equal(f.frames.size, 1); f.tick();
  assert.equal(f.styles.get("--pointer-x"), "60px");
  assert.equal(f.styles.get("--pointer-y"), "80px"); f.cleanup();
});

test("directory glow leaves touch, coarse pointers, and reduced motion alone", () => {
  for (const options of [{ reduced: true }, { coarse: true }, {}]) {
    const f = fixture(options); f.move(140, 150, Object.keys(options).length ? "mouse" : "touch");
    assert.equal(f.frames.size, 0); assert.equal(f.styles.size, 0); f.cleanup();
  }
});

test("leaving a card resets coordinates and cancels queued updates", () => {
  const f = fixture(); f.move(140, 150); f.tick(); assert.equal(f.styles.size, 2);
  f.move(150, 170); f.leave(); assert.equal(f.styles.size, 0); assert.equal(f.frames.size, 0);
  f.move(140, 150); f.tick(); f.move(10, 10, "mouse", {}); assert.equal(f.styles.size, 0); f.cleanup();
});

test("live preference changes remove the pointer glow", () => {
  const f = fixture(); f.move(140, 150); f.tick();
  f.motion.matches = true; f.motion.dispatchEvent(new Event("change"));
  assert.equal(f.styles.size, 0); f.move(150, 170); assert.equal(f.frames.size, 0); f.cleanup();
});

test("route teardown releases events and animation frames; missing directory is inert", () => {
  const f = fixture(); f.move(140, 150); f.cleanup();
  assert.equal(f.frames.size, 0); f.move(160, 180); assert.equal(f.frames.size, 0);
  const absent = fixture({ missing: true }); absent.cleanup();
});

test("home and friends mount their own scoped shader hosts, retaining the real directory", () => {
  const network = fs.readFileSync(new URL("../src/components/FriendNetwork.astro", import.meta.url), "utf8");
  const home = fs.readFileSync(new URL("../src/components/AcademicHome.astro", import.meta.url), "utf8");
  const page = fs.readFileSync(new URL("../src/pages/friends.astro", import.meta.url), "utf8");
  assert.match(network, /mountStarMaps\("\.friends-main \[data-star-map\]"\)/);
  assert.match(home, /mountStarMaps\("\.academic-home \[data-star-map\]"\)/);
  assert.match(network, /FRIEND_LINKS\.slice\(1, 3\)/);
  assert.match(network, /HNUSEC_MEMBER_LINKS\.slice\(0, 2\)/);
  assert.match(network, /ORGANIZATION_LINKS\.slice\(0, 2\)/);
  assert.match(network, /href=\{friend.url\}/);
  assert.match(network, /rel="noopener noreferrer"/);
  for (const group of ["friendCards", "hnusecCards", "organizationCards"]) assert.match(page, new RegExp(`${group}\\.map`));
  for (const id of ["friend-blogs", "friend-hnusec", "friend-organizations"]) assert.ok(page.includes(`id="${id}"`));
});
