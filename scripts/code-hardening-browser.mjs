import assert from "node:assert/strict";
import path from "node:path";

const article = "/blog/codeql-learning/";
const waitPage = (page) =>
  page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-astro-transition"),
  );
const frames = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );

export async function checkCodeHardening(page, { base, output, prefix }) {
  await page.goto(`${base}${article}`);
  await page.locator(".copy-code").first().waitFor({ state: "visible" });
  await waitPage(page);
  const originalTheme = await page.locator("html").getAttribute("data-theme");
  const assertThemeAPI = async () => {
    assert.equal(
      await page.evaluate(
        () =>
          window.theme.themeValue === window.theme.getTheme() &&
          window.theme.getTheme() === document.documentElement.dataset.theme,
      ),
      true,
    );
  };
  await assertThemeAPI();
  const themeButton = prefix.endsWith("mobile")
    ? "#theme-btn-mobile"
    : "#theme-btn";
  if (prefix.endsWith("mobile")) await page.locator("#menu-btn").click();
  const buttonNode = await page.locator(themeButton).elementHandle();
  await page.locator(themeButton).click();
  await page.waitForFunction(
    (theme) => document.documentElement.dataset.theme !== theme,
    originalTheme,
  );
  await page.waitForFunction(
    () => !document.documentElement.dataset.themeReveal,
  );
  await assertThemeAPI();
  // Remounting must reuse the button DOM node, preserving focus/third-party bindings.
  await page.evaluate(() =>
    document.dispatchEvent(new Event("astro:after-swap")),
  );
  assert.equal(
    await page.evaluate(
      (node) =>
        node ===
        document.querySelector(
          node.id === "theme-btn" ? "#theme-btn" : "#theme-btn-mobile",
        ),
      buttonNode,
    ),
    true,
  );
  await page.locator(themeButton).click();
  await page.waitForFunction(
    (theme) => document.documentElement.dataset.theme === theme,
    originalTheme,
  );
  await page.waitForFunction(
    () => !document.documentElement.dataset.themeReveal,
  );
  if (prefix.endsWith("mobile")) await page.locator("#menu-btn").click();
  await buttonNode.dispose();

  // A slower previous clipboard rejection must not overwrite the latest success.
  const copy = page.locator(".copy-code").first();
  await page.evaluate(() => {
    window.__copyRequests = [];
    window.__originalWrite = navigator.clipboard.writeText;
    navigator.clipboard.writeText = () =>
      new Promise((resolve, reject) =>
        window.__copyRequests.push({ resolve, reject }),
      );
  });
  try {
    await copy.click();
    await copy.click();
    assert.equal(await page.evaluate(() => window.__copyRequests.length), 2);
    await page.evaluate(() => window.__copyRequests[1].resolve());
    await page.waitForFunction(
      () => document.querySelector(".copy-code").dataset.copyState === "copied",
    );
    await page.evaluate(() =>
      window.__copyRequests[0].reject(new Error("older write failed")),
    );
    await frames(page);
    assert.equal(await copy.getAttribute("data-copy-state"), "copied");
  } finally {
    await page.evaluate(() => {
      navigator.clipboard.writeText = window.__originalWrite;
      delete window.__copyRequests;
      delete window.__originalWrite;
    });
  }

  const dialog = page.locator("#search-modal");
  await page.evaluate(() => (document.body.style.overflow = "clip"));
  await page.keyboard.press("Control+k");
  await dialog
    .locator(".pagefind-ui__search-input")
    .waitFor({ state: "visible" });
  assert.equal(await page.locator("#search-modal:modal").count(), 1);
  const focusEscaped = await page
    .locator('header a[href="/"]')
    .first()
    .evaluate((node) => {
      node.focus();
      return document.activeElement === node;
    });
  assert.equal(focusEscaped, false, "native modal keeps the background inert");
  const close = dialog.locator(".search-dialog-close");
  await close.focus();
  await page.keyboard.press("Shift+Tab");
  assert.equal(
    await dialog
      .locator('a[href="/search/"]')
      .evaluate((node) => node === document.activeElement),
    true,
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await close.evaluate((node) => node === document.activeElement),
    true,
  );
  await page.screenshot({
    path: path.join(output, `hardening-search-${prefix}.png`),
  });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(
    await page.locator("body").evaluate((node) => node.style.overflow),
    "clip",
  );
  // close() queues its event. Reopening in the same task must retain its new lease.
  await page.keyboard.press("Control+k");
  await dialog.waitFor({ state: "visible" });
  await page.evaluate(() => {
    document.querySelector("#search-modal").close();
    document.querySelector("[data-search-trigger]").click();
  });
  await frames(page);
  assert.equal(await dialog.evaluate((node) => node.open), true);
  assert.equal(
    await page.locator("body").evaluate((node) => node.style.overflow),
    "hidden",
  );
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(
    await page.locator("body").evaluate((node) => node.style.overflow),
    "clip",
  );
  await page.evaluate(() => (document.body.style.overflow = ""));

  // An open modal must release its body lease before a ClientRouter swap.
  await page.keyboard.press("Control+k");
  await dialog.waitFor({ state: "visible" });
  await dialog.locator('a[href="/search/"]').click();
  await page.waitForURL(`${base}/search/`);
  await page
    .locator("#pagefind-search .pagefind-ui__search-input")
    .waitFor({ state: "visible" });
  assert.notEqual(
    await page.locator("body").evaluate((node) => node.style.overflow),
    "hidden",
  );
  // URL query synchronization must preserve an existing hash.
  await page.evaluate(() =>
    history.replaceState(history.state, "", "/search/#main-content"),
  );
  await page
    .locator("#pagefind-search .pagefind-ui__search-input")
    .fill("CodeQL");
  await page.waitForFunction(() => location.search.includes("q=CodeQL"));
  assert.equal(new URL(page.url()).hash, "#main-content");
  const chapter = page
    .locator(`#pagefind-search a[href="${article}#ccpp"]`)
    .first();
  await chapter.waitFor({ state: "visible" });
  await chapter.click();
  await page.waitForURL(`${base}${article}#ccpp`);
  await page.locator(".copy-code").first().waitFor({ state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  // Hash navigation respects the article's smooth-scroll CSS. Measure its
  // settled destination, not the first frame after history.pushState().
  await page.waitForFunction(() => {
    const top = document.getElementById("ccpp")?.getBoundingClientRect().top;
    return top !== undefined && top >= 60 && top <= 160;
  });
  await frames(page);
  const anchor = await page.locator("#ccpp").boundingBox();
  assert(
    anchor && anchor.y >= 60 && anchor.y <= 160,
    `enhanced chapter remains aligned: ${anchor?.y}px`,
  );
  const reserved = await page
    .locator('#article img[src$="01-codeql-architecture.png"]')
    .evaluate((node) => ({
      width: node.getAttribute("width"),
      height: node.getAttribute("height"),
    }));
  assert.deepEqual(reserved, { width: "1408", height: "768" });
  await page.screenshot({
    path: path.join(output, `hardening-anchor-${prefix}.png`),
  });
  await page.goBack();
  await page.waitForURL(`${base}/search/?q=CodeQL#main-content`);
  await page
    .locator("#pagefind-search .pagefind-ui__search-input")
    .waitFor({ state: "visible" });
  const result = page.locator(`#pagefind-search a[href="${article}"]`).first();
  await result.waitFor({ state: "visible" });
  await result.click();
  await page.waitForURL(`${base}${article}`);
  await page.locator("#article").waitFor({ state: "visible" });
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: "instant" }));
  await page.waitForFunction(() => scrollY >= 690);
  const position = await page.evaluate(() => scrollY);
  await page
    .locator('header a[href="/"]')
    .first()
    .evaluate((node) => node.click());
  await page.waitForURL(`${base}/`);
  await page.locator(".academic-home").waitFor({ state: "visible" });
  await page.goBack();
  await page.waitForURL(`${base}${article}`);
  await page.locator("#article").waitFor({ state: "visible" });
  await page.waitForFunction((y) => Math.abs(scrollY - y) <= 2, position);
  await page.goto(`${base}/galleries/bx-journey/`);
  const gallery = page.locator("#gallery-lightbox");
  const triggers = page.locator('[data-gallery-target="gallery-lightbox"]');
  const count = await triggers.count();
  assert(count > 1, "published gallery has real images");
  await page.evaluate(() => (document.body.style.overflow = "clip"));
  await triggers.first().click();
  await gallery.waitFor({ state: "visible" });
  assert.equal(await page.locator("#gallery-lightbox:modal").count(), 1);
  assert.equal(
    await gallery.locator("[data-gallery-counter]").textContent(),
    `1 / ${count}`,
  );
  await page.keyboard.press("ArrowLeft");
  assert.equal(
    await gallery.locator("[data-gallery-counter]").textContent(),
    `${count} / ${count}`,
  );
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await gallery.locator("[data-gallery-counter]").textContent(),
    `1 / ${count}`,
  );
  await page.keyboard.press("Escape");
  await gallery.waitFor({ state: "hidden" });
  assert.equal(
    await page.locator("body").evaluate((node) => node.style.overflow),
    "clip",
  );
  assert.equal(
    await triggers.first().evaluate((node) => node === document.activeElement),
    true,
  );
  // Both page-load remount and route departure must release the original body.
  await triggers.first().click();
  await page.evaluate(() =>
    document.dispatchEvent(new Event("astro:page-load")),
  );
  await gallery.waitFor({ state: "hidden" });
  assert.equal(
    await page.locator("body").evaluate((node) => node.style.overflow),
    "clip",
  );
  await page.evaluate(() => (document.body.style.overflow = ""));
  await triggers.first().click();
  await page
    .locator('header a[href="/"]')
    .first()
    .evaluate((node) => node.click());
  await page.waitForURL(`${base}/`);
  await page.locator(".academic-home").waitFor({ state: "visible" });
  assert.equal(
    await page.locator("body").evaluate((node) => node.style.overflow),
    "",
  );
  console.log(
    `[hardening] ${prefix}: theme API/identity, clipboard race, native modality, scroll leases, search hash/anchoring, history and gallery cleanup passed`,
  );
}

export async function checkStorageAndSearchBoundaries(browser, { base }) {
  for (const mode of ["property", "methods", "write-only"]) {
    const context = await browser.newContext({
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((mode) => {
      const deny = () => {
        throw new DOMException("storage denied", "SecurityError");
      };
      if (mode === "property") {
        Object.defineProperty(window, "localStorage", { get: deny });
        Object.defineProperty(window, "sessionStorage", { get: deny });
      } else {
        Object.defineProperty(Storage.prototype, "setItem", { value: deny });
        if (mode === "methods")
          Object.defineProperty(Storage.prototype, "getItem", { value: deny });
      }
    }, mode);
    try {
      await page.goto(`${base}${article}`);
      await page.locator(".copy-code").first().waitFor({ state: "visible" });
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        "light",
      );
      await page.locator("#theme-btn").click();
      await page.waitForFunction(
        () => document.documentElement.dataset.theme === "dark",
      );
      await page.emulateMedia({ colorScheme: "dark" });
      await page.emulateMedia({ colorScheme: "light" });
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        "dark",
      );
      await page.locator('header a[href="/"]').first().click();
      await page.waitForURL(`${base}/`);
      await page.locator(".academic-home").waitFor({ state: "visible" });
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        "dark",
      );
      await waitPage(page);
      if (mode === "property") {
        const peer = await context.newPage();
        await peer.goto(base);
        await page.bringToFront();
        await peer.evaluate(() => localStorage.setItem("theme", "light"));
        await frames(page);
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          "dark",
        );
        await peer.close();
      }
      assert.deepEqual(errors, [], `denied storage mode: ${mode}`);
      console.log(`[hardening] denied storage ${mode} passed`);
    } finally {
      await context.close();
    }
  }
  // Storage clear() has a null event key. It should resume the current system theme.
  const context = await browser.newContext({
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    await page.goto(base);
    await page.locator("#theme-btn").click();
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "light",
    );
    const peer = await context.newPage();
    await peer.goto(base);
    await page.bringToFront();
    await peer.evaluate(() => localStorage.clear());
    await page.waitForFunction(
      () => document.documentElement.dataset.theme === "dark",
    );
    assert.equal(await page.evaluate(() => window.theme.getTheme()), "dark");
  } finally {
    await context.close();
  }

  // Hold the real dynamically imported UI chunk across a route swap.
  const slowContext = await browser.newContext({ reducedMotion: "reduce" });
  const slowPage = await slowContext.newPage();
  const errors = [];
  slowPage.on("pageerror", (error) => errors.push(error.message));
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  let requested;
  const loading = new Promise((resolve) => {
    requested = resolve;
  });
  await slowPage.route("**/_astro/ui-core*.js", async (route) => {
    requested();
    await held;
    await route.continue();
  });
  try {
    await slowPage.goto(base);
    await slowPage.keyboard.press("Control+k");
    await Promise.race([
      loading,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("delayed UI chunk was not requested")),
          10000,
        ),
      ),
    ]);
    await slowPage.evaluate(() => {
      document.addEventListener(
        "astro:before-swap",
        () => {
          window.__searchSwapStarted = true;
        },
        { once: true },
      );
    });
    await slowPage.locator('#search-modal a[href="/search/"]').click();
    // Hold through the actual old-mount abort, not through the router's script
    // completion barrier (which can legitimately require this same UI chunk).
    await slowPage.waitForFunction(() => window.__searchSwapStarted === true);
    release();
    await slowPage.waitForURL(`${base}/search/`);
    const input = slowPage.locator(
      "#pagefind-search .pagefind-ui__search-input",
    );
    await input.waitFor({ state: "visible" });
    assert.equal(
      await slowPage
        .locator("#search-modal .pagefind-ui__search-input")
        .count(),
      0,
      "stale mount is not initialized on the new page",
    );
    await input.fill("CodeQL");
    await slowPage
      .locator(`#pagefind-search a[href="${article}"]`)
      .first()
      .waitFor({ state: "visible" });
    assert.notEqual(
      await slowPage.locator("body").evaluate((node) => node.style.overflow),
      "hidden",
    );
    assert.deepEqual(errors, []);
  } finally {
    release();
    await slowContext.close();
  }
  console.log(
    "[hardening] denied storage (3 modes), cross-tab clear and delayed search import passed",
  );
}
