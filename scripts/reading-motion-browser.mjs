import assert from "node:assert/strict";
import path from "node:path";

const settle = (page) =>
  page.waitForFunction(
    () =>
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .every(
          (animation) =>
            animation.playState === "finished" ||
            animation.playState === "idle",
        ),
    null,
    { timeout: 2500 },
  );

/** Real motion, cancellation and reduced-motion checks, not just static CSS. */
export async function checkReadingMotion(page, { base, output, prefix }) {
  const articlePath = "/blog/openrasp-sql-detect-bypass/";
  const theme = prefix.split("-")[0];
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    if (window.__readingPhaseTwoInstrumented) return;
    window.__readingPhaseTwoInstrumented = true;
    window.__readingEntryAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (this.matches(".entry-row--blog"))
        window.__readingEntryAnimations.push(animation);
      return animation;
    };
    document.addEventListener("astro:after-preparation", () => {
      const titles = [
        ...document.querySelectorAll(
          "[data-article-title], [data-reading-title]",
        ),
      ];
      const names = titles
        .map((node) => getComputedStyle(node).viewTransitionName)
        .filter((name) => name !== "none");
      window.__readingPreparedTitle = {
        name:
          titles.find((node) => node.style.viewTransitionName)?.style
            .viewTransitionName ?? "none",
        unique: new Set(names).size === names.length,
      };
    });
    document.addEventListener("astro:before-swap", (event) => {
      window.__readingNativeReady = null;
      event.viewTransition.ready.then(
        () => {
          window.__readingNativeReady = true;
        },
        (error) => {
          window.__readingNativeReady = error.name;
        },
      );
    });
  });
  try {
    await page.goto(`${base}/blog/`);
    await page.waitForFunction(
      () => window.__readingEntryAnimations.length > 0,
    );
    const entrances = await page.evaluate(() =>
      window.__readingEntryAnimations.map((animation) => ({
        ...animation.effect.getTiming(),
        startOpacity: animation.effect.getKeyframes()[0].opacity,
      })),
    );
    entrances.forEach((timing, index) => {
      assert.equal(timing.duration, 420);
      assert.equal(timing.delay, Math.min(index * 45, 180));
      assert.equal(
        timing.startOpacity,
        "0.65",
        "entries remain readable throughout entrance",
      );
    });
    await settle(page);
    await page.screenshot({
      path: path.join(output, `motion-list-${prefix}.png`),
    });
    const title = page.locator(`a[data-article-title][href="${articlePath}"]`);
    await title.waitFor();
    const name = await title.evaluate(
      (node) => getComputedStyle(node).viewTransitionName,
    );
    assert.match(name, /^reading-title-/);
    const names = await page
      .locator("[data-article-title]")
      .evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node).viewTransitionName),
      );
    assert.equal(
      new Set(names).size,
      names.length,
      "listing title identities are unique",
    );
    await page.evaluate(() => {
      window.__readingMotionVisit = "same-document";
    });
    await title.click();
    await page.waitForURL(`${base}${articlePath}`);
    await page.locator("h1[data-article-title]").waitFor();
    assert.equal(
      await page.evaluate(() => window.__readingMotionVisit),
      "same-document",
    );
    assert.equal(
      await page
        .locator("h1[data-article-title]")
        .evaluate((node) => getComputedStyle(node).viewTransitionName),
      name,
    );
    console.log(`[motion] ${prefix}: shared title matched`);
    await settle(page);

    const trigger = page.locator("#article .article-image-trigger").first();
    const image = trigger.locator("img");
    await trigger.waitFor();
    await trigger.scrollIntoViewIfNeeded();
    await image.evaluate((node) => node.decode());
    console.log(`[motion] ${prefix}: source image decoded in viewport`);
    const position = await page.evaluate(() => scrollY);
    await trigger.click();
    const viewer = page.locator("#article-lightbox");
    const full = viewer.locator("[data-image-full]");
    await viewer.waitFor({ state: "visible" });
    await page.waitForFunction(() =>
      document
        .querySelector("[data-image-full]")
        .getAnimations()
        .some((animation) => animation.playState === "running"),
    );
    const frames = await full.evaluate((node) => {
      const animation = node.getAnimations()[0];
      animation.pause();
      animation.currentTime =
        Number(animation.effect.getTiming().duration) * 0.45;
      return animation.effect.getKeyframes().map(({ transform }) => transform);
    });
    assert.match(
      frames[0],
      /^translate\(/,
      "image starts at the clicked viewport rectangle",
    );
    assert.equal(frames.at(-1), "none");
    await page.screenshot({
      path: path.join(output, `motion-image-mid-${prefix}.png`),
    });
    await full.evaluate(async (node) => {
      const animation = node.getAnimations()[0];
      animation.play();
      await animation.finished;
    });
    const bounds = await full.boundingBox();
    const viewport = page.viewportSize();
    assert(Math.abs(bounds.x + bounds.width / 2 - viewport.width / 2) < 1);
    assert(Math.abs(bounds.y + bounds.height / 2 - viewport.height / 2) < 1);
    await page.screenshot({
      path: path.join(output, `motion-image-open-${prefix}.png`),
    });
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await viewer.waitFor({ state: "hidden" });
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
    );
    assert.equal(await image.evaluate((node) => node.style.visibility), "");
    assert(Math.abs((await page.evaluate(() => scrollY)) - position) <= 1);
    assert.notEqual(
      await page.locator("body").evaluate((node) => node.style.overflow),
      "hidden",
    );

    if (viewport.width < 1200) {
      const opener = page.locator("[data-post-toc-open]");
      await opener.click();
      const toc = page.locator("#post-toc-dialog");
      await toc.waitFor({ state: "visible" });
      await settle(page);
      assert(await toc.locator("[data-toc-active]").count());
      const sheet = await toc.boundingBox();
      assert(
        Math.abs(sheet.x + sheet.width / 2 - viewport.width / 2) < 1,
        "mobile TOC sheet stays horizontally centered",
      );
      assert(
        sheet.y >= 0 && sheet.y + sheet.height <= viewport.height,
        "mobile TOC sheet stays within the viewport",
      );
      await page.screenshot({
        path: path.join(output, `motion-toc-${prefix}.png`),
      });
      await page.keyboard.press("Escape");
      await toc.waitFor({ state: "hidden" });
      assert.equal(
        await opener.evaluate((node) => node === document.activeElement),
        true,
      );
    }

    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    const copy = page.locator("#article .copy-code").first();
    await copy.click();
    await page.waitForFunction(
      () =>
        document.querySelector("#article .copy-code").dataset.copyState ===
        "copied",
    );
    assert.equal(await copy.innerText(), "Copied");
    const code = await page.locator("#article pre code").first().innerText();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      code,
    );

    const themeButton = page.locator("#theme-btn");
    let revealButton = themeButton;
    if (!(await themeButton.isVisible())) {
      await page.locator("#menu-btn").click();
      revealButton = page.locator("#theme-btn-mobile");
    }
    await revealButton.evaluate((node) =>
      node.addEventListener(
        "click",
        () => {
          window.__themeRevealOrigin = node.getBoundingClientRect().toJSON();
        },
        { once: true, capture: true },
      ),
    );
    await revealButton.click();
    const origin = await page.evaluate(() => window.__themeRevealOrigin);
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .some((a) =>
          a.effect
            ?.getKeyframes()
            .some((f) => f.clipPath?.startsWith("circle(")),
        ),
    );
    const revealFrames = await page.evaluate(() => {
      const animation = document
        .getAnimations()
        .find((a) =>
          a.effect
            ?.getKeyframes()
            .some((f) => f.clipPath?.startsWith("circle(")),
        );
      animation.pause();
      animation.currentTime =
        Number(animation.effect.getTiming().duration) * 0.45;
      return {
        frames: animation.effect.getKeyframes().map((f) => f.clipPath),
        duration: animation.effect.getTiming().duration,
      };
    });
    assert.equal(revealFrames.duration, 520);
    const circle = /circle\(([\d.]+)px at ([\d.]+)px ([\d.]+)px\)/.exec(
      revealFrames.frames.at(-1),
    );
    assert(circle, "native theme reveal uses a circular clip");
    const [radius, x, y] = circle.slice(1).map(Number);
    assert(Math.abs(x - (origin.x + origin.width / 2)) < 1);
    assert(Math.abs(y - (origin.y + origin.height / 2)) < 1);
    for (const [cx, cy] of [
      [0, 0],
      [viewport.width, 0],
      [0, viewport.height],
      [viewport.width, viewport.height],
    ])
      assert(radius > Math.hypot(x - cx, y - cy));
    assert.equal(
      await page
        .locator("h1[data-article-title]")
        .evaluate((node) => getComputedStyle(node).viewTransitionName),
      "none",
      "theme snapshot does not split the article title",
    );
    assert.equal(
      await page
        .locator("#article .copy-code")
        .first()
        .evaluate((node) => getComputedStyle(node).transitionDuration),
      "0s",
      "snapshot captures the complete target palette, not intermediate control colors",
    );
    await page.screenshot({
      path: path.join(output, `motion-theme-mid-${prefix}.png`),
    });
    await page.evaluate(async () => {
      const animation = document
        .getAnimations()
        .find((a) =>
          a.effect
            ?.getKeyframes()
            .some((f) => f.clipPath?.startsWith("circle(")),
        );
      animation.play();
      await animation.finished;
    });
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute("data-theme-reveal"),
    );
    if (!(await themeButton.isVisible()))
      await page.locator("#menu-btn").click();
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      theme === "light" ? "dark" : "light",
    );
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute("data-theme-changing"),
    );
    assert.match(
      await page
        .locator("h1[data-article-title]")
        .evaluate((node) => getComputedStyle(node).viewTransitionName),
      /^reading-title-/,
    );

    await page.evaluate(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight * 0.55,
        behavior: "instant",
      }),
    );
    await page.locator('#btt-btn-container[data-visible="true"]').waitFor();
    assert.equal(
      await page.locator("#btt-btn-container").evaluate((node) => node.inert),
      false,
    );
    await page.locator("[data-button='back-to-top']").click();
    await page.waitForFunction(() => scrollY < 1);
    await page.waitForFunction(
      () => document.querySelector("#btt-btn-container").inert,
    );

    // A live preference change settles an in-flight animation immediately.
    await trigger.click();
    await viewer.waitFor({ state: "visible" });
    await page.waitForFunction(
      () =>
        document.querySelector("[data-image-full]").getAnimations().length > 0,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () =>
        document.querySelector("[data-image-full]").getAnimations().length ===
        0,
    );
    await page.keyboard.press("Escape");
    await viewer.waitFor({ state: "hidden" });

    await trigger.click();
    await viewer.waitFor({ state: "visible" });
    await full.evaluate((node) => node.decode());
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector("[data-image-full]"))
          .visibility === "visible",
    );
    assert.equal(await full.evaluate((node) => node.getAnimations().length), 0);
    assert.equal(
      await page
        .locator("html")
        .evaluate((node) => getComputedStyle(node).scrollBehavior),
      "auto",
    );
    await page.keyboard.press("Escape");
    await viewer.waitFor({ state: "hidden" });
    assert.equal(
      await trigger.evaluate((node) => node === document.activeElement),
      true,
    );

    // Real browser Back during an opening must release focus/scroll state.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const previousViewer = await viewer.elementHandle();
    const previousImage = await image.elementHandle();
    await trigger.click();
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForURL(`${base}/blog/`);
    await page.locator(".entry-row--blog").first().waitFor();
    assert.equal(await previousViewer.evaluate((node) => node.open), false);
    assert.equal(
      await previousImage.evaluate((node) => node.style.visibility),
      "",
    );
    assert.notEqual(
      await page.locator("body").evaluate((node) => node.style.overflow),
      "hidden",
    );
    await previousViewer.dispose();
    await previousImage.dispose();
    await page.locator(`a[data-article-title][href="${articlePath}"]`).click();
    await page.waitForURL(`${base}${articlePath}`);
    await page.locator("#article .article-image-trigger").first().click();
    await viewer.waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await viewer.waitFor({ state: "hidden" });
    // Onward links can repeat a destination. Only the selected title is named.
    for (const [route, selector, keyboard] of [
      [articlePath, ".post-related a[data-reading-link]", false],
      [articlePath, ".post-nav-link[data-reading-link]", true],
      [
        "/blog/redis-core-guide/",
        ".post-series-chapters a[data-reading-link]",
        false,
      ],
      [
        "/blog/redis-core-guide/",
        ".post-series-nav a[data-reading-link]",
        true,
      ],
    ]) {
      await page.goto(`${base}${route}`);
      const link = page.locator(selector).first();
      await link.waitFor();
      const target = new URL(await link.getAttribute("href"), base).href;
      const sourceTitle =
        (await link.getAttribute("data-reading-title")) !== null
          ? link
          : link.locator("[data-reading-title]");
      const oldTitle = await sourceTitle.elementHandle();
      assert.equal(
        await oldTitle.evaluate(
          (node) => getComputedStyle(node).viewTransitionName,
        ),
        "none",
      );
      if (keyboard) await link.press("Enter");
      else await link.click();
      await page.waitForURL(target);
      await page.locator("h1[data-article-title]").waitFor();
      await page.waitForFunction(() => window.__readingNativeReady !== null);
      await settle(page);
      const evidence = await page.evaluate(() => ({
        prepared: window.__readingPreparedTitle,
        ready: window.__readingNativeReady,
        name: getComputedStyle(document.querySelector("h1[data-article-title]"))
          .viewTransitionName,
      }));
      assert.equal(evidence.prepared.name, evidence.name, selector);
      assert.equal(
        evidence.prepared.unique,
        true,
        "no duplicate transition names",
      );
      assert.equal(
        evidence.ready,
        true,
        "native ViewTransition snapshot succeeds",
      );
      assert.equal(
        await oldTitle.evaluate((node) => node.style.viewTransitionName),
        "",
        "swap restores temporary source style",
      );
      await oldTitle.dispose();
    }
    // Router return must not replay the archive's initial-only stagger.
    // Both the desktop nav and breadcrumb are hidden on a narrow viewport.
    if (await page.locator("#menu-btn").isVisible()) {
      await page
        .getByRole("button", { name: "Open menu", exact: true })
        .click();
      await page
        .locator("#mobile-menu")
        .getByRole("link", { name: "Posts", exact: true })
        .click();
    } else {
      await page.getByRole("link", { name: "Posts", exact: true }).click();
    }
    await page.waitForURL(`${base}/blog/`);
    assert.equal(
      await page.evaluate(() => window.__readingEntryAnimations.length),
      0,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.waitForLoadState("load");
    assert.equal(
      await page.evaluate(() => window.__readingEntryAnimations.length),
      0,
    );
    await page.goto(`${base}${articlePath}`);
    const quietLink = page
      .locator(".post-related a[data-reading-link]")
      .first();
    const quietTarget = new URL(await quietLink.getAttribute("href"), base)
      .href;
    await quietLink.click();
    await page.waitForURL(quietTarget);
    await page.locator("h1[data-article-title]").waitFor();
    assert.equal(
      await page.evaluate(() => window.__readingPreparedTitle.name),
      "none",
    );
    console.log(
      `[motion] ${prefix}: initial stagger, 4 onward title transitions, keyboard and reduced motion passed`,
    );
    await checkThemeAndCursor(page, { base, output, prefix });
  } finally {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate((value) => localStorage.setItem("theme", value), theme);
  }
}

async function checkThemeAndCursor(page, { base, prefix }) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(`${base}/blog/`);
  await settle(page);
  const desktop = await page.locator("#theme-btn").isVisible();
  if (!desktop) await page.locator("#menu-btn").click();
  const selector = desktop ? "#theme-btn" : "#theme-btn-mobile";
  const button = page.locator(selector);
  const initial = await page.locator("html").getAttribute("data-theme");

  // Two toggles in the same task exercise cancellation before the first native
  // callback runs, not merely a pair of already-completed transitions.
  await button.evaluate((node) => {
    node.click();
    node.click();
  });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-theme-reveal"),
  );
  assert.equal(await page.locator("html").getAttribute("data-theme"), initial);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("theme")),
    initial,
  );

  // A real storage event from another tab wins over an in-flight local reveal.
  const peer = await page.context().newPage();
  try {
    await peer.goto(`${base}/blog/`);
    await page.bringToFront();
    await button.click();
    await page.waitForFunction(() =>
      document.documentElement.hasAttribute("data-theme-reveal"),
    );
    await peer.evaluate(
      (value) => localStorage.setItem("theme", value),
      initial,
    );
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute("data-theme-reveal"),
    );
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      initial,
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem("theme")),
      initial,
    );
  } finally {
    await peer.close();
  }

  await button.click();
  await page.waitForFunction(() =>
    document.documentElement.hasAttribute("data-theme-reveal"),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-theme-reveal"),
  );
  const committed = await page.locator("html").getAttribute("data-theme");
  assert.notEqual(committed, initial);
  await button.click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), initial);
  assert.equal(
    await page.locator("html").getAttribute("data-theme-reveal"),
    null,
  );
  assert.equal(
    await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((a) =>
            a.effect
              ?.getKeyframes()
              .some((f) => f.clipPath?.startsWith("circle(")),
          ).length,
    ),
    0,
  );

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await button.click();
  await page.waitForFunction(() =>
    document.documentElement.hasAttribute("data-theme-reveal"),
  );
  const target = initial === "dark" ? "light" : "dark";
  await page.locator('header a[href="/"]').first().click();
  await page.waitForURL(`${base}/`);
  await page.locator(".academic-home").waitFor();
  await settle(page);
  assert.equal(await page.locator("html").getAttribute("data-theme"), target);
  assert.equal(
    await page.locator("html").getAttribute("data-theme-reveal"),
    null,
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem("theme")),
    target,
  );
  assert.equal(
    await page.evaluate(
      () =>
        document.querySelector('meta[name="theme-color"]').content ===
        getComputedStyle(document.documentElement)
          .getPropertyValue("--background")
          .trim(),
    ),
    true,
  );

  await page.goto(`${base}/blog/`);
  await settle(page);
  await page.mouse.move(40, 100);
  await page.waitForFunction(() =>
    document.querySelector(".site-cursor-glow").classList.contains("active"),
  );
  const width = page.viewportSize().width;
  const burst = await page.evaluate((x) => {
    const original = window.requestAnimationFrame;
    let calls = 0;
    window.requestAnimationFrame = (...args) => {
      calls++;
      return original(...args);
    };
    try {
      for (let i = 0; i < 100; i++)
        document.dispatchEvent(
          new PointerEvent("pointermove", {
            pointerType: "mouse",
            clientX: x,
            clientY: 300 + i,
          }),
        );
    } finally {
      window.requestAnimationFrame = original;
    }
    return calls;
  }, width - 50);
  assert(burst <= 1, "100 pointer updates share at most one pending frame");
  await page.waitForFunction((x) => {
    const style = document.querySelector(".site-backdrop").style;
    return (
      Math.abs(parseFloat(style.getPropertyValue("--site-cx")) - x) < 0.3 &&
      Math.abs(parseFloat(style.getPropertyValue("--site-cy")) - 399) < 0.3
    );
  }, width - 50);
  const glow = page.locator(".site-cursor-glow");
  assert.equal(
    await glow.evaluate((node) => node.style.willChange),
    "transform",
  );
  assert.match(
    await glow.evaluate((node) => getComputedStyle(node).transform),
    /^matrix/,
  );
  await page.mouse.move(-10, -10);
  await page.waitForFunction(
    () =>
      !document.querySelector(".site-cursor-glow").classList.contains("active"),
  );
  assert.equal(await glow.evaluate((node) => node.style.willChange), "");
  await page.mouse.move(100, 100);
  await page.waitForFunction(() =>
    document.querySelector(".site-cursor-glow").classList.contains("active"),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () =>
      !document.querySelector(".site-cursor-glow").classList.contains("active"),
  );
  await page.mouse.move(200, 200);
  assert.equal(
    await glow.evaluate((node) => getComputedStyle(node).display),
    "none",
  );

  const touch = await page
    .context()
    .browser()
    .newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
  try {
    const phone = await touch.newPage();
    await phone.goto(`${base}/blog/`);
    await phone.waitForLoadState("load");
    await phone.evaluate(() =>
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          pointerType: "mouse",
          clientX: 100,
          clientY: 200,
        }),
      ),
    );
    assert.equal(
      await phone
        .locator(".site-cursor-glow")
        .evaluate((node) => getComputedStyle(node).display),
      "none",
    );
    assert.equal(
      await phone
        .locator(".site-cursor-glow")
        .evaluate((node) => node.classList.contains("active")),
      false,
    );
  } finally {
    await touch.close();
  }
  for (const mode of ["missing-native", "unsupported-pseudo"]) {
    const compatibility = await page.context().browser().newContext();
    try {
      const plain = await compatibility.newPage();
      const errors = [];
      plain.on("pageerror", (error) => errors.push(error.message));
      await plain.addInitScript((value) => {
        if (value === "missing-native")
          Object.defineProperty(document, "startViewTransition", {
            value: undefined,
          });
        else {
          const animate = Element.prototype.animate;
          Element.prototype.animate = function (frames, options) {
            if (options?.pseudoElement)
              throw new DOMException(
                "fixture: unsupported pseudo animation",
                "NotSupportedError",
              );
            return animate.call(this, frames, options);
          };
        }
      }, mode);
      await plain.goto(`${base}/blog/`);
      const before = await plain.locator("html").getAttribute("data-theme");
      await plain.locator("#theme-btn").click();
      await plain.waitForFunction(
        (value) => document.documentElement.dataset.theme !== value,
        before,
      );
      await plain.waitForFunction(
        () => !document.documentElement.hasAttribute("data-theme-reveal"),
      );
      assert.equal(
        await plain.evaluate(() => localStorage.getItem("theme")),
        before === "light" ? "dark" : "light",
      );
      assert.deepEqual(errors, [], mode);
    } finally {
      await compatibility.close();
    }
  }
  console.log(
    `[motion] ${prefix}: theme reveal, rapid toggle, cross-tab sync, interruption and composited cursor passed`,
  );
}
