import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const home = fs.readFileSync(new URL("../src/components/AcademicHome.astro", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
const text = home.split("<style>")[0].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// Approved copy is a contract: a redesign must not summarize or invent biography.
const paragraphs = [
  "Hey, I'm bx.",
  "Welcome to my blog!",
  "I'm currently focused on Cybersecurity and Large Language Models (LLMs), while staying curious about interesting technologies and the unknown.",
  "This is my little corner of the internet where I document what I learn, explore, and think about. Most of the content revolves around technology, including study notes, hands-on experiences, and scattered thoughts. Occasionally, I'll also share things beyond the world of tech.",
  "I don't expect every post to have all the answers. More often than not, what I write simply reflects my understanding at a particular point in time. As I continue to explore and learn, my perspectives may shift, my understanding will evolve, and I'll revisit, refine, and update what I've written along the way.",
  "I hope this blog becomes a space where ideas and experiences gradually accumulate, leaving traces of my explorations and capturing my growth along the journey.",
  "Feel free to look around! If something here helps you, sparks a thought, or gives you a different perspective, I'd love to hear from you.",
  "Let's explore the stars and beyond together. 🌟",
];

test("homepage preserves the entire approved introduction in order", () => {
  let position = 0;
  for (const paragraph of paragraphs) {
    // Inline elements may insert a space before punctuation.
    const normalized = text.replace(/\s+([.,!])/g, "$1");
    const next = normalized.indexOf(paragraph, position);
    assert.ok(next >= position, `Missing or out-of-order copy: ${paragraph}`);
    position = next + paragraph.length;
  }
  assert.match(home, /<main[^>]+lang="en"/);
});

test("homepage keeps only the requested education details, without dates or resume sections", () => {
  for (const marker of ["Hainan University", "HNU", "Bachelor's studies in Information Security", "University of Chinese Academy of Sciences", "UCAS", "Master's studies"]) {
    assert.ok(text.includes(marker), `Missing education detail: ${marker}`);
  }
  assert.doesNotMatch(text, /2023|2027|Zhang Boxiang|张博翔|Honors|Research interests|Selected work/);
  assert.doesNotMatch(home, /mailto:|research-proof|awards-list/);
  assert.equal((home.match(/<h1\b/g) ?? []).length, 1);
  assert.match(home, /aria-labelledby="education-title"/);
});

test("homepage keeps existing reader entry routes and uses bx metadata", () => {
  assert.match(home, /href="\/blog\/"/);
  assert.match(home, /href="\/notes\/"/);
  assert.match(home, /href=\{SITE.profile\}/);
  assert.match(index, /title="bx · Cybersecurity, LLMs & Personal Notes"/);
  assert.doesNotMatch(index, /Zhang Boxiang|张博翔/);
});
