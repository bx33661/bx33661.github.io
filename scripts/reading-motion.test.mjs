import assert from "node:assert/strict";
import { test } from "node:test";
import {
  imageOriginTransform,
  articleTransitionName,
  READING_MOTION,
  readingTransition,
  readingEntryDelay,
  themeRevealGeometry,
} from "../src/utils/reading-motion.ts";

test("image origins use viewport centers and independent width/height scales", () => {
  assert.equal(
    imageOriginTransform(
      { x: 100, y: 200, width: 300, height: 200 },
      { x: 200, y: 100, width: 600, height: 400 },
    ),
    "translate(-250px, 0px) scale(0.5, 0.5)",
  );
  assert.equal(
    imageOriginTransform(
      { x: 20, y: -400, width: 200, height: 1200 },
      { x: 100, y: 20, width: 100, height: 600 },
    ),
    "translate(-30px, -120px) scale(2, 2)",
  );
});
test("invalid or undecoded image geometry produces a non-geometric fallback", () => {
  const box = { x: 0, y: 0, width: 100, height: 100 };
  for (const width of [0, -1, NaN, Infinity]) {
    assert.equal(imageOriginTransform({ ...box, width }, box), null);
    assert.equal(imageOriginTransform(box, { ...box, width }), null);
  }
});
test("transition identity is route-derived, CSS-safe, and ignores query/hash", () => {
  const name = articleTransitionName("/blog/example/");
  assert.match(name, /^reading-title-[a-f0-9]+$/);
  for (const path of [
    "/blog/example",
    "/blog/example/?foo=bar#chapter",
    "https://example.com/blog/example/",
  ])
    assert.equal(articleTransitionName(path), name);
  assert.notEqual(name, articleTransitionName("/blog/other/"));
});
test("motion tokens retain a short non-bouncy entry and quicker exit", () => {
  assert(READING_MOTION.imageIn > READING_MOTION.imageOut);
  assert(READING_MOTION.dialogIn > READING_MOTION.dialogOut);
  assert(READING_MOTION.imageIn < 500);
  assert.equal(readingTransition.forwards.new.name, "reading-surface-in");
  assert.deepEqual(readingTransition.forwards, readingTransition.backwards);
});

test("archive entrance delay is bounded and tolerates invalid indices", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 20].map(readingEntryDelay),
    [0, 45, 90, 135, 180, 180],
  );
  for (const index of [-1, NaN, Infinity])
    assert.equal(readingEntryDelay(index), 0);
  assert.equal(readingEntryDelay(1.9), 45);
});

test("theme reveal covers every viewport corner and clamps offscreen controls", () => {
  for (const [x, y, width, height] of [
    [1360, 32, 1440, 900],
    [330, 260, 390, 844],
    [0, 0, 320, 640],
    [-20, 950, 390, 844],
  ]) {
    const circle = themeRevealGeometry(x, y, width, height);
    assert(circle);
    for (const [cx, cy] of [
      [0, 0],
      [width, 0],
      [0, height],
      [width, height],
    ])
      assert(circle.radius > Math.hypot(circle.x - cx, circle.y - cy));
    assert(circle.x >= 0 && circle.x <= width);
    assert(circle.y >= 0 && circle.y <= height);
  }
});
test("theme reveal rejects invalid geometry instead of emitting invalid CSS", () => {
  for (const values of [
    [NaN, 0, 300, 400],
    [0, 0, 0, 400],
    [0, 0, 300, -1],
    [0, Infinity, 300, 400],
  ])
    assert.equal(themeRevealGeometry(...values), null);
  assert.equal(READING_MOTION.themeIn, 520);
});
