import { onViewportScroll } from "./astro-lifecycle";
import { bindArticleDialog } from "./article-dialog";
import { prefersReducedMotion } from "./reading-motion";

export function setupArticleToc(signal: AbortSignal) {
  const main = document.querySelector<HTMLElement>("main.post-page");
  const article = document.querySelector<HTMLElement>("#article");
  const postHeader = document.querySelector<HTMLElement>(".post-page .post-header");
  const siteHeader = document.querySelector<HTMLElement>("body > header.header-glass");
  const readingBar = siteHeader?.querySelector<HTMLElement>("[data-reading-bar]");
  const readingBack = siteHeader?.querySelector<HTMLAnchorElement>("[data-reading-bar-back]");
  const readingTopBtn = siteHeader?.querySelector<HTMLButtonElement>("[data-reading-bar-top]");
  const readingSep = siteHeader?.querySelector<HTMLElement>("[data-reading-bar-sep]");
  const readingChapterWrap = siteHeader?.querySelector<HTMLElement>("[data-reading-bar-chapter-wrap]");
  const readingChapterBtn = siteHeader?.querySelector<HTMLButtonElement>("[data-reading-bar-chapter]");
  const readingChapterText = siteHeader?.querySelector<HTMLElement>("[data-reading-bar-chapter-text]");
  const readingRing = siteHeader?.querySelector<HTMLElement>("[data-reading-bar-ring]");
  const readingPct = siteHeader?.querySelector<HTMLElement>("[data-reading-bar-pct]");
  const readingPopover = siteHeader?.querySelector<HTMLElement>("[data-reading-bar-popover]");
  const readingPopoverPct = siteHeader?.querySelector<HTMLElement>("[data-reading-bar-popover-pct]");
  const readingPopoverToc = siteHeader?.querySelector<HTMLElement>("[data-reading-bar-toc]");

  const sidebar = document.querySelector<HTMLElement>(".post-toc-sidebar");
  const progressBar = document.querySelector<HTMLElement>("[data-toc-progress-bar]");
  const progressLabel = document.querySelector<HTMLElement>("[data-toc-progress-label]");
  const mobilePct = document.querySelector<HTMLElement>("[data-toc-mobile-pct]");
  const jumpComments = document.querySelector<HTMLAnchorElement>("[data-toc-jump-comments]");

  if (jumpComments) {
    jumpComments.hidden = !document.getElementById("comments");
  }

  const totalMinutes = Math.max(
    1,
    Number(main?.dataset.readingMinutes || sidebar?.dataset.readingMinutes) || 1,
  );
  const isEnglish = document.documentElement.lang === "en";

  const titleText = document.querySelector<HTMLElement>(".post-page .post-title")?.textContent?.trim() ?? "";
  if (readingTopBtn) {
    readingTopBtn.textContent = titleText;
    readingTopBtn.addEventListener(
      "click",
      () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "instant" : "smooth" });
      },
      { signal },
    );
  }

  const syncBackHref = () => {
    if (!readingBack) return;
    const backBtn = document.querySelector<HTMLAnchorElement>("#back-button");
    readingBack.href = backBtn?.href || main?.dataset.readingBackDefault || "/";
  };
  syncBackHref();

  const closePopover = () => {
    if (!readingPopover || readingPopover.hidden) return;
    readingPopover.hidden = true;
    readingChapterBtn?.setAttribute("aria-expanded", "false");
  };

  // Clone canonical inline TOC into the header reading-bar popover before collecting [data-post-toc] links
  const canonicalTocList = document.querySelector<HTMLElement>(".post-toc-inline [data-post-toc] > ol");
  if (readingPopoverToc) {
    readingPopoverToc.replaceChildren();
    if (canonicalTocList) {
      readingPopoverToc.appendChild(canonicalTocList.cloneNode(true));
      readingPopoverToc.setAttribute("data-post-toc", "");
    } else {
      readingPopoverToc.removeAttribute("data-post-toc");
    }
  }

  signal.addEventListener(
    "abort",
    () => {
      closePopover();
      if (siteHeader) delete siteHeader.dataset.readingActive;
      readingBar?.setAttribute("aria-hidden", "true");
      if (readingPopoverToc) {
        readingPopoverToc.replaceChildren();
        readingPopoverToc.removeAttribute("data-post-toc");
      }
    },
    { once: true },
  );

  const updateReadingProgress = () => {
    if (!article) return;
    const rect = article.getBoundingClientRect();
    const start = Math.max(0, rect.top + scrollY - 96);
    const distance = Math.max(1, rect.height - innerHeight + 96);
    const rawPct = Math.max(0, Math.min(100, ((scrollY - start) / distance) * 100));
    const rounded = Math.round(rawPct);

    const headerActive = Boolean(postHeader && innerWidth >= 640 && postHeader.getBoundingClientRect().bottom < 56);
    if (siteHeader) {
      if (headerActive) {
        syncBackHref();
        siteHeader.dataset.readingActive = "true";
        readingBar?.setAttribute("aria-hidden", "false");
      } else {
        delete siteHeader.dataset.readingActive;
        readingBar?.setAttribute("aria-hidden", "true");
        closePopover();
      }
    }

    if (progressBar) {
      progressBar.style.transform = `scaleX(${rawPct / 100})`;
    }
    if (mobilePct) {
      mobilePct.textContent = `${rounded}%`;
    }
    if (readingPopoverPct) {
      readingPopoverPct.textContent = `${rounded}%`;
    }
    if (readingRing) {
      readingRing.style.background = `conic-gradient(var(--accent) ${rawPct.toFixed(1)}%, color-mix(in srgb, var(--foreground) 14%, transparent) 0)`;
    }

    const doneText = progressLabel?.dataset.doneLabel || (isEnglish ? "Completed ✓" : "已读完 ✓");
    const leftMin = Math.max(1, Math.ceil(((100 - rawPct) / 100) * totalMinutes));
    const statusText =
      rounded >= 98
        ? doneText
        : isEnglish
          ? `${rounded}% · ~${leftMin}m left`
          : `已读 ${rounded}% · 剩 ${leftMin} 分钟`;

    if (readingPct) {
      readingPct.textContent = statusText;
    }
    if (progressLabel) {
      if (rounded >= 98) {
        progressLabel.textContent = doneText;
        progressLabel.dataset.state = "done";
      } else if (rounded <= 2) {
        progressLabel.textContent =
          totalMinutes > 1
            ? isEnglish
              ? `${totalMinutes}m`
              : `约 ${totalMinutes} 分钟`
            : progressLabel.dataset.idleLabel || "0%";
        delete progressLabel.dataset.state;
      } else {
        progressLabel.textContent = statusText;
        delete progressLabel.dataset.state;
      }
    }
  };

  const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-post-toc] a[href^='#']")];
  const linkedIds = new Set(links.map((link) => decodeURIComponent(link.hash.slice(1))));
  const headings = [...document.querySelectorAll<HTMLElement>("#article > :is(h1,h2,h3)[id]")].filter((heading) =>
    linkedIds.has(heading.id),
  );

  const hasChapters = headings.length > 0 && links.length > 0;
  if (readingSep) readingSep.hidden = !hasChapters;
  if (readingChapterWrap) readingChapterWrap.hidden = !hasChapters;

  if (!hasChapters) {
    const scheduleProgressOnly = onViewportScroll(signal, updateReadingProgress);
    scheduleProgressOnly();
    return;
  }

  const dialog = document.querySelector<HTMLDialogElement>("#post-toc-dialog");
  const modal = dialog ? bindArticleDialog(dialog, signal) : null;
  const open = document.querySelector<HTMLButtonElement>("[data-post-toc-open]");
  document.querySelector(".post-toc-mobile")?.setAttribute("data-toc-ready", "true");

  const positionMarkers = () => {
    for (const nav of document.querySelectorAll<HTMLElement>("[data-post-toc]")) {
      const current = nav.querySelector<HTMLElement>('a[aria-current="location"]');
      if (!current || !nav.getClientRects().length) continue;
      nav.style.setProperty("--toc-marker-y", `${current.offsetTop}px`);
      nav.style.setProperty("--toc-marker-h", `${current.offsetHeight}px`);
      nav.dataset.tocActive = "true";
    }
  };

  const keepVisible = (link: HTMLAnchorElement) => {
    const nav = link.closest("nav");
    if (!nav || !nav.getClientRects().length) return;
    const box = nav.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    if (item.top < box.top + 8) nav.scrollTop += item.top - box.top - 8;
    else if (item.bottom > box.bottom - 8) nav.scrollTop += item.bottom - box.bottom + 8;
  };

  const ensureCurrentVisible = () => {
    links.filter((link) => link.hasAttribute("aria-current")).forEach(keepVisible);
    positionMarkers();
  };

  open?.addEventListener(
    "click",
    () => {
      modal?.open(open);
      ensureCurrentVisible();
    },
    { signal },
  );
  dialog?.querySelector("[data-post-toc-close]")?.addEventListener("click", () => modal?.close(), { signal });
  dialog?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => modal?.close(), { signal }));
  document.querySelectorAll("details.post-toc-inline").forEach((details) => {
    details.addEventListener("toggle", ensureCurrentVisible, { signal });
  });

  readingChapterBtn?.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();
      if (!readingPopover) return;
      const nextOpen = readingPopover.hidden;
      readingPopover.hidden = !nextOpen;
      readingChapterBtn.setAttribute("aria-expanded", String(nextOpen));
      if (nextOpen) ensureCurrentVisible();
    },
    { signal },
  );
  readingPopover?.addEventListener(
    "click",
    (event) => {
      if ((event.target as HTMLElement | null)?.closest("a")) {
        closePopover();
      }
    },
    { signal },
  );
  document.addEventListener(
    "click",
    (event) => {
      if (!readingPopover || readingPopover.hidden) return;
      const target = event.target as Node | null;
      if (target && !readingPopover.contains(target) && !readingChapterBtn?.contains(target)) {
        closePopover();
      }
    },
    { signal },
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && readingPopover && !readingPopover.hidden) {
        closePopover();
        readingChapterBtn?.focus();
      }
    },
    { signal },
  );

  let activeId = "";
  const update = () => {
    updateReadingProgress();
    const offset = Math.max(96, (document.querySelector("body > header")?.getBoundingClientRect().height ?? 64) + 24);
    let active = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > offset) break;
      active = heading;
    }
    if (activeId === active.id) {
      ensureCurrentVisible();
      return;
    }
    activeId = active.id;
    for (const link of links) {
      const current = decodeURIComponent(link.hash.slice(1)) === active.id;
      if (current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
      if (current) keepVisible(link);
    }
    positionMarkers();
    const label =
      active.textContent?.replace(/#\s*$/, "").trim() ??
      (isEnglish ? "On this page" : "本文目录");
    const currentLabel = document.querySelector("[data-toc-current]");
    if (currentLabel) currentLabel.textContent = label;
    if (readingChapterText) readingChapterText.textContent = label;
  };

  const schedule = onViewportScroll(signal, update);
  window.addEventListener("hashchange", schedule, { signal });
  const observer = new ResizeObserver(schedule);
  if (article) observer.observe(article);
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  schedule();
}
