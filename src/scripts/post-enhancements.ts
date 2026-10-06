import { setupArticleToc } from "./article-toc";
import { setupArticleLightbox } from "./article-lightbox";
import { setupArticleFormatting } from "./article-formatting";

let postController: AbortController | null = null;

function setupProgressBar(article: HTMLElement, signal: AbortSignal) {
  const container = document.createElement("div");
  container.className =
    "progress-container fixed top-0 z-50 h-1 w-full bg-background";
  const bar = document.createElement("div");
  bar.className = "progress-bar h-1 w-0 bg-accent";
  bar.id = "myBar";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", "正文阅读进度");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  container.appendChild(bar);
  document.body.appendChild(container);
  let frame = 0;
  const update = () => {
    frame = 0;
    const rect = article.getBoundingClientRect();
    const start = Math.max(0, rect.top + scrollY - 96);
    const distance = Math.max(1, rect.height - innerHeight + 96);
    const value = Math.max(
      0,
      Math.min(100, ((scrollY - start) / distance) * 100),
    );
    bar.style.width = `${value}%`;
    bar.setAttribute("aria-valuenow", String(Math.round(value)));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { signal, passive: true });
  window.addEventListener("resize", schedule, { signal, passive: true });
  signal.addEventListener(
    "abort",
    () => {
      cancelAnimationFrame(frame);
      container.remove();
    },
    { once: true },
  );
  schedule();
}

function attachHeadingLinks(article: HTMLElement) {
  for (const heading of article.querySelectorAll<HTMLElement>(
    ":scope > :is(h2,h3,h4,h5,h6)[id]",
  )) {
    if (heading.querySelector(".heading-link")) continue;
    heading.classList.add("group");
    const link = document.createElement("a");
    link.className =
      "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";
    link.href = `#${heading.id}`;
    link.setAttribute("aria-label", `跳转到：${heading.textContent?.trim()}`);
    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.textContent = "#";
    link.appendChild(span);
    heading.appendChild(link);
  }
}

function attachCopyButtons(article: HTMLElement, signal: AbortSignal) {
  for (const block of article.querySelectorAll<HTMLElement>("pre")) {
    if (block.closest(".not-prose")) continue;
    if (!block.querySelector("code")) continue;
    let button = block.querySelector<HTMLButtonElement>(".copy-code");
    if (!button) {
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      const hasOffset =
        getComputedStyle(block)
          .getPropertyValue("--file-name-offset")
          .trim() !== "";
      button = document.createElement("button");
      button.type = "button";
      button.className = `copy-code absolute end-3 ${hasOffset ? "top-(--file-name-offset)" : "-top-3"} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium`;
      button.setAttribute("aria-label", "复制代码");
      button.setAttribute("aria-live", "polite");
      block.setAttribute("tabindex", "0");
      block.appendChild(button);
      block.parentNode?.insertBefore(wrapper, block);
      wrapper.appendChild(block);
    }
    const copy = button;
    copy.textContent = "Copy";
    let timer = 0;
    copy.addEventListener(
      "click",
      async () => {
        try {
          await navigator.clipboard.writeText(
            block.querySelector("code")?.innerText ?? "",
          );
          if (signal.aborted) return;
          copy.textContent = "Copied";
        } catch {
          if (signal.aborted) return;
          copy.textContent = "复制失败";
        }
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          copy.textContent = "Copy";
        }, 1200);
      },
      { signal },
    );
    signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  }
}

export function initPostEnhancements() {
  postController?.abort();
  postController = new AbortController();
  const article = document.querySelector<HTMLElement>(".post-page #article");
  if (!article) return;
  const { signal } = postController;
  setupProgressBar(article, signal);
  setupArticleFormatting(article);
  attachHeadingLinks(article);
  attachCopyButtons(article, signal);
  setupArticleToc(signal);
  setupArticleLightbox(signal);
}

document.addEventListener("astro:page-load", initPostEnhancements);
document.addEventListener("astro:before-swap", () => postController?.abort());
document.addEventListener("astro:after-swap", () =>
  window.scrollTo({ left: 0, top: 0, behavior: "instant" }),
);
