import assert from "node:assert/strict";
import path from "node:path";

/** The image itself stays centered, with no card or toolbar around it. */
async function assertLightboxCentered(page, viewer) {
  await viewer.locator("[data-image-full]").evaluate(async (image) => {
    await image.decode();
    await Promise.all(
      image
        .getAnimations()
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  const viewport = page.viewportSize();
  const rect = await viewer.locator("[data-image-full]").boundingBox();
  const styles = await viewer.evaluate((el) => ({
    background: getComputedStyle(el).backgroundColor,
    border: getComputedStyle(el).borderWidth,
  }));
  assert.equal(styles.background, "rgba(0, 0, 0, 0)");
  assert.equal(styles.border, "0px");
  assert.equal(
    await viewer
      .locator("header, [data-image-size], [data-image-caption]")
      .count(),
    0,
  );
  assert(rect && viewport, "lightbox has a viewport-relative box");
  assert(
    Math.abs(rect.x + rect.width / 2 - viewport.width / 2) <= 1 &&
      Math.abs(rect.y + rect.height / 2 - viewport.height / 2) <= 1,
    "lightbox stays centered horizontally and vertically",
  );
  assert(
    rect.x >= 0 &&
      rect.y >= 0 &&
      rect.x + rect.width <= viewport.width + 1 &&
      rect.y + rect.height <= viewport.height + 1,
    "full image stays inside the viewport",
  );
}

/** Real reader paths, called by verify:visual for both themes and viewport sizes. */
export async function checkArticleExperience(page, { base, output, prefix }) {
  await page.goto(`${base}/blog/`, { waitUntil: "domcontentloaded" });
  await page.locator(".entry-row--blog").first().waitFor();
  assert(
    (await page.locator('.entry-tags a[href^="/blog/tags/"]').count()) > 0,
  );
  const timestamps = await page
    .locator(".entry-dates > time")
    .evaluateAll((nodes) =>
      nodes.map((node) => Date.parse(node.getAttribute("datetime"))),
    );
  assert(
    timestamps.every((date, i) => i === 0 || timestamps[i - 1] >= date),
    "listing dates match latest-first ordering",
  );
  // Validate the rows that actually exist; newly published posts can push all
  // updated entries off the first page. Updated-date semantics also have a
  // deterministic unit fixture in article-discovery.test.mjs.
  for (const row of await page.locator(".entry-row--blog").all()) {
    const updated = (await row.locator(".entry-original-date").count()) > 0;
    assert.equal(
      (await row.locator(".entry-date-label").innerText()).trim(),
      updated ? "更新于" : "发表于",
    );
    const dates = await row
      .locator("time")
      .evaluateAll((nodes) => nodes.map((node) => Date.parse(node.dateTime)));
    assert.equal(dates.length, updated ? 2 : 1);
    assert(dates.every(Number.isFinite), "listing dates are valid");
    if (updated)
      assert(dates[0] > dates[1], "update date is later than publication");
  }
  await page.screenshot({ path: path.join(output, `blog-list-${prefix}.png`) });

  await page.goto(`${base}/blog/codeql-learning/`, {
    waitUntil: "domcontentloaded",
  });
  const imageButton = page.locator("#article .article-image-trigger").first();
  await imageButton.waitFor();
  const image = imageButton.locator("img");
  const originalSrc = await image.evaluate((img) => img.src);
  await imageButton.click();
  const viewer = page.locator("#article-lightbox");
  await viewer.waitFor({ state: "visible" });
  await viewer.locator("[data-image-full]").evaluate((img) => img.decode());
  await assertLightboxCentered(page, viewer);
  assert.equal(
    await viewer.locator("[data-image-full]").evaluate((img) => img.src),
    originalSrc,
  );
  assert.equal(
    await page.locator("body").evaluate((body) => body.style.overflow),
    "hidden",
  );
  await page.screenshot({
    path: path.join(output, `article-image-${prefix}.png`),
  });
  await page.keyboard.press("Escape");
  await viewer.waitFor({ state: "hidden" });
  assert.equal(
    await imageButton.evaluate((button) => button === document.activeElement),
    true,
    "lightbox returns focus",
  );
  assert.notEqual(
    await page.locator("body").evaluate((body) => body.style.overflow),
    "hidden",
  );

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const firstCode = page.locator("#article pre.astro-code").first();
  const expected = await firstCode.locator("code").innerText();
  await firstCode.locator(".copy-code").click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    expected,
  );

  const ids = await page
    .locator("#article > :is(h2,h3)[id]")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  const id = ids.at(-1);
  await page.evaluate((id) => {
    const heading = document.getElementById(id);
    window.scrollTo({
      top: heading.getBoundingClientRect().top + scrollY - 90,
      behavior: "instant",
    });
  }, id);
  await page.waitForFunction((id) => {
    const current = [
      ...document.querySelectorAll(
        '[data-post-toc] a[aria-current="location"]',
      ),
    ];
    return (
      current.length > 0 &&
      current.every((link) => decodeURIComponent(link.hash.slice(1)) === id)
    );
  }, id);
  if ((page.viewportSize()?.width ?? 0) < 1200) {
    const open = page.locator("[data-post-toc-open]");
    await open.click();
    const toc = page.locator("#post-toc-dialog");
    await toc.waitFor({ state: "visible" });
    assert.equal(
      await toc.locator('a[aria-current="location"]').evaluate((link) => {
        const item = link.getBoundingClientRect();
        const nav = link.closest("nav").getBoundingClientRect();
        return item.top >= nav.top && item.bottom <= nav.bottom;
      }),
      true,
      "opening the mobile TOC reveals the current chapter",
    );
    await page.screenshot({
      path: path.join(output, `article-toc-${prefix}.png`),
    });
    await page.keyboard.press("Escape");
    await toc.waitFor({ state: "hidden" });
    assert.equal(
      await open.evaluate((button) => button === document.activeElement),
      true,
      "TOC restores focus",
    );
    await open.click();
    const anchor = toc.locator("a").first();
    const href = await anchor.getAttribute("href");
    await anchor.click();
    await toc.waitFor({ state: "hidden" });
    assert.equal(decodeURIComponent(new URL(page.url()).hash), href);
    assert.notEqual(
      await page.locator("body").evaluate((body) => body.style.overflow),
      "hidden",
    );
  }
  await page.screenshot({
    path: path.join(output, `article-reading-${prefix}.png`),
  });

  // Reproduce the reported offset on the actual article, including its tall image.
  await page.goto(`${base}/blog/openrasp-sql-detect-bypass/`, {
    waitUntil: "domcontentloaded",
  });
  const raspImages = page.locator("#article .article-image-trigger");
  await raspImages.first().waitFor();
  for (const index of [0, (await raspImages.count()) - 1]) {
    const trigger = raspImages.nth(index);
    await trigger.click();
    await viewer.waitFor({ state: "visible" });
    await viewer.locator("[data-image-full]").evaluate((img) => img.decode());
    const readingPosition = await page.evaluate(() => scrollY);
    await assertLightboxCentered(page, viewer);
    await page.screenshot({
      path: path.join(output, `rasp-image-${index}-${prefix}.png`),
    });
    await viewer.locator("[data-image-full]").click();
    await viewer.waitFor({ state: "hidden" });
    assert(
      Math.abs((await page.evaluate(() => scrollY)) - readingPosition) <= 1,
      "closing the RASP image preserves the reading position",
    );
    assert(await trigger.evaluate((el) => el === document.activeElement));
    await trigger.click();
    await page.mouse.click(2, page.viewportSize().height / 2);
    await viewer.waitFor({ state: "hidden" });
    assert(await trigger.evaluate((el) => el === document.activeElement));
  }

  // Fourth-level subheadings remain under their enclosing TOC chapter.
  await page.goto(`${base}/blog/claude-code/`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForFunction(() =>
    document.querySelector("[data-post-toc] a[aria-current]"),
  );
  const enclosingChapter = await page.evaluate(() => {
    const subheading = document.querySelector("#article > h4[id]");
    let previous = subheading.previousElementSibling;
    while (previous && !previous.matches(":is(h1,h2,h3)[id]"))
      previous = previous.previousElementSibling;
    window.scrollTo({
      top: subheading.getBoundingClientRect().top + scrollY - 90,
      behavior: "instant",
    });
    return previous.id;
  });
  await page.waitForFunction((id) => {
    const current = [
      ...document.querySelectorAll(
        '[data-post-toc] a[aria-current="location"]',
      ),
    ];
    return (
      current.length > 0 &&
      current.every((link) => decodeURIComponent(link.hash.slice(1)) === id)
    );
  }, enclosingChapter);

  await page.goto(`${base}/blog/redis-core-guide/`, {
    waitUntil: "domcontentloaded",
  });
  const series = page.locator(".post-series");
  assert.match(await series.innerText(), /Redis 学习与实践/);
  assert.match(
    await series.locator('[aria-current="page"]').innerText(),
    /Redis 与缓存基础/,
  );
  assert.equal(
    await series.locator(".post-series-nav a").count(),
    1,
    "first chapter has no previous chapter",
  );
  const related = page.locator(".post-related a");
  assert((await related.count()) > 0, "same-topic recommendation is present");
  const relatedHrefs = await related.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("href")),
  );
  assert(
    !relatedHrefs.includes("/blog/redis-core-guide/"),
    "no self recommendation",
  );
  await series.locator(".post-series-nav a").click();
  await page.waitForURL(`${base}/blog/redis-lua-script-part2/`);
  assert.match(
    await page.locator('.post-series [aria-current="page"]').innerText(),
    /Part 2/,
  );
  assert.equal(
    await page
      .locator('.post-series-nav a[href="/blog/redis-core-guide/"]')
      .count(),
    1,
  );
  await page
    .locator(".post-series")
    .screenshot({ path: path.join(output, `article-series-${prefix}.png`) });
  assert.equal(
    await page.locator(".progress-container").count(),
    1,
    "no duplicate reading progress after ClientRouter swap",
  );

  // A real site link exercises cleanup on leaving the article, not just page.goto.
  await page.locator('header a[href="/"]').first().click();
  await page.waitForURL(`${base}/`);
  await page.locator(".academic-home").waitFor();
  assert.equal(await page.locator(".progress-container").count(), 0);
  assert.notEqual(
    await page.locator("body").evaluate((body) => body.style.overflow),
    "hidden",
  );
}
