import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { SITE } from "../src/config.ts";

const home = fs.readFileSync(new URL("../src/components/AcademicHome.astro", import.meta.url), "utf8");
const copy = SITE.home.zh;
const renderedIntro = [
  `${copy.greetingPrefix}${copy.greetingHighlight}`,
  copy.welcome,
  `${copy.focusLeadPrefix}${copy.focusLeadStrong}${copy.focusLeadSuffix}`,
  ...copy.introParagraphs,
  `${copy.closing} ${copy.closingEmoji ?? "✦"}`,
].join(" ");

const paragraphs = [
  "Hey, I'm bx.",
  "Welcome to my blog!",
  "I'm currently focused on the field of Computer Science, while staying curious about interesting technologies and the unknown.",
  "This is my little corner of the internet where I document what I learn, explore, and think about. Most of the content revolves around technology, including study notes, hands-on experiences, and scattered thoughts. Occasionally, I'll also share things beyond the world of tech.",
  "I don't expect every post to have all the answers. More often than not, what I write simply reflects my understanding at a particular point in time. As I continue to explore and learn, my perspectives may shift, my understanding will evolve, and I'll revisit, refine, and update what I've written along the way.",
  "I hope this blog becomes a space where ideas and experiences gradually accumulate, leaving traces of my explorations and capturing my growth along the journey.",
  "Feel free to look around! If something here helps you, sparks a thought, or gives you a different perspective, I'd love to hear from you.",
  "Let's explore the stars and beyond together. 🌟",
];

test("homepage preserves the entire approved introduction in order", () => {
  let position = 0;
  const normalized = renderedIntro.replace(/\s+/g, " ").trim();
  for (const paragraph of paragraphs) {
    const next = normalized.indexOf(paragraph, position);
    assert.ok(next >= position, `Missing or out-of-order copy: ${paragraph}`);
    position = next + paragraph.length;
  }
  assert.equal(copy.monographLang, "en");
  assert.match(home, /<main[^>]+lang=\{monographLang\}/);
});

test("homepage removes personal education and resume details while keeping focus metadata", () => {
  const combined = `${renderedIntro} ${home}`;
  for (const removed of [
    "Education",
    "Hainan University",
    "HNU",
    "Bachelor's studies",
    "University of Chinese Academy of Sciences",
    "UCAS",
    "Master's studies",
    "education-section",
    "education-title",
    "/schools/",
  ]) {
    assert.ok(!combined.includes(removed), `Unexpected education detail remains: ${removed}`);
  }
  assert.doesNotMatch(renderedIntro, /2023|2027|Zhang Boxiang|张博翔|Honors|Research interests|Selected work/);
  assert.doesNotMatch(home, /mailto:|research-proof|awards-list/);
  assert.equal((home.match(/<h1\b/g) ?? []).length, 1);
  assert.match(home, /aria-labelledby="focus-title"/);
});

test("homepage keeps existing reader entry routes and uses bx metadata", () => {
  assert.match(home, /localizedPath\("\/blog\/", locale\)/);
  assert.match(home, /localizedPath\("\/notes\/", locale\)/);
  assert.match(home, /href=\{SITE\.profile\}/);
  assert.equal(copy.pageTitle, "bx · Cybersecurity, LLMs & Personal Notes");
  assert.doesNotMatch(copy.pageTitle, /Zhang Boxiang|张博翔/);
});
