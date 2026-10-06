import { bindArticleDialog } from "./article-dialog";

export function setupArticleToc(signal: AbortSignal) {
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>(
      "[data-post-toc] a[href^='#']",
    ),
  ];
  const linkedIds = new Set(
    links.map((link) => decodeURIComponent(link.hash.slice(1))),
  );
  const headings = [
    ...document.querySelectorAll<HTMLElement>("#article > :is(h1,h2,h3)[id]"),
  ].filter((heading) => linkedIds.has(heading.id));
  if (!headings.length || !links.length) return;
  const dialog = document.querySelector<HTMLDialogElement>("#post-toc-dialog");
  const modal = dialog ? bindArticleDialog(dialog, signal) : null;
  const open = document.querySelector<HTMLButtonElement>(
    "[data-post-toc-open]",
  );
  document
    .querySelector(".post-toc-mobile")
    ?.setAttribute("data-toc-ready", "true");
  open?.addEventListener(
    "click",
    () => {
      modal?.open(open);
      ensureCurrentVisible();
    },
    { signal },
  );
  dialog
    ?.querySelector("[data-post-toc-close]")
    ?.addEventListener("click", () => modal?.close(), { signal });
  dialog
    ?.querySelectorAll("a")
    .forEach((link) =>
      link.addEventListener("click", () => modal?.close(), { signal }),
    );

  let frame = 0;
  let activeId = "";
  const keepVisible = (link: HTMLAnchorElement) => {
    const nav = link.closest("nav");
    if (!nav || !nav.getClientRects().length) return;
    const box = nav.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    if (item.top < box.top + 8) nav.scrollTop += item.top - box.top - 8;
    else if (item.bottom > box.bottom - 8)
      nav.scrollTop += item.bottom - box.bottom + 8;
  };
  const ensureCurrentVisible = () => {
    links
      .filter((link) => link.hasAttribute("aria-current"))
      .forEach(keepVisible);
  };
  document.querySelectorAll("details.post-toc-inline").forEach((details) => {
    details.addEventListener("toggle", ensureCurrentVisible, { signal });
  });
  const update = () => {
    frame = 0;
    const offset = Math.max(
      96,
      (document.querySelector("body > header")?.getBoundingClientRect()
        .height ?? 64) + 24,
    );
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
    const label = active.textContent?.replace(/#\s*$/, "").trim() ?? "本文目录";
    const currentLabel = document.querySelector("[data-toc-current]");
    if (currentLabel) currentLabel.textContent = label;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { signal, passive: true });
  window.addEventListener("resize", schedule, { signal, passive: true });
  window.addEventListener("hashchange", schedule, { signal });
  signal.addEventListener("abort", () => cancelAnimationFrame(frame), {
    once: true,
  });
  const observer = new ResizeObserver(schedule);
  const article = document.querySelector("#article");
  if (article) observer.observe(article);
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  schedule();
}
