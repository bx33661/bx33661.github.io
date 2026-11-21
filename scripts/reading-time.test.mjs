import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateReadingMinutes, isInteractivePost } from "../src/utils/readingTime.ts";
import { transformerLongCode } from "../src/utils/transformers/longCode.ts";

test("estimateReadingMinutes handles empty, short, CJK, English and mixed content", () => {
  assert.equal(estimateReadingMinutes(undefined), 1);
  assert.equal(estimateReadingMinutes(""), 1);
  assert.equal(estimateReadingMinutes("---\ntitle: Demo\n---\nHello world."), 1);

  const cjk = "安全研究与代码审计笔记。".repeat(60); // 11 * 60 = 660 chars -> ~2 min
  assert.equal(estimateReadingMinutes(cjk), 2);

  const english = "security engineering reproducible notes ".repeat(110); // 440 words -> 2 min
  assert.equal(estimateReadingMinutes(english), 2);

  const mixed = `${"网络安全实践".repeat(60)}\n\n\`\`\`ts\n${"const token = value; ".repeat(60)}\n\`\`\``;
  assert.ok(estimateReadingMinutes(mixed) >= 2);
});

test("isInteractivePost detects bespoke interactive MDX diagrams", () => {
  assert.equal(isInteractivePost(undefined), false);
  assert.equal(isInteractivePost("Regular markdown article with code blocks."), false);
  assert.equal(
    isInteractivePost(
      'import WifiSecurityDiagram from "@/components/WifiSecurityDiagram.astro";\n<WifiSecurityDiagram />',
    ),
    true,
  );
  assert.equal(isInteractivePost("<CyberGymFeature />"), true);
  assert.equal(isInteractivePost("<TrustBoundarySimulator />"), true);
  assert.equal(isInteractivePost("<MiniappAuditFeature />"), true);
});

test("transformerLongCode tags only blocks meeting minLines with metadata", () => {
  const transformer = transformerLongCode(36);
  const shortNode = { type: "element", tagName: "pre", properties: {}, children: [] };
  transformer.pre.call({ source: "const a = 1;\n".repeat(12) }, shortNode);
  assert.equal(shortNode.properties["data-code-collapsible"], undefined);
  assert.equal(shortNode.properties["data-code-lines"], undefined);

  const longNode = { type: "element", tagName: "pre", properties: {}, children: [] };
  transformer.pre.call({ source: "const line = true;\n".repeat(42) }, longNode);
  assert.equal(longNode.properties["data-code-collapsible"], "true");
  assert.equal(longNode.properties["data-code-lines"], "42");
});
