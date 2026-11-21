import { onAstroPage, onViewportScroll } from "./astro-lifecycle";
import { setupArticleToc } from "./article-toc";
import { setupArticleLightbox } from "./article-lightbox";
import { setupArticleFormatting } from "./article-formatting";
import { setupReadingControls } from "./reading-controls";

function setupProgressBar(article: HTMLElement, signal: AbortSignal) {
  const container = document.createElement("div");
  container.className = "progress-container fixed top-0 z-50 h-1 w-full bg-background";
  const bar = document.createElement("div");
  bar.className = "progress-bar h-1 w-full bg-accent";
  bar.id = "myBar";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", document.documentElement.lang === "en" ? "Article reading progress" : "正文阅读进度");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  container.appendChild(bar);
  document.body.appendChild(container);

  const update = () => {
    const rect = article.getBoundingClientRect();
    const start = Math.max(0, rect.top + scrollY - 96);
    const distance = Math.max(1, rect.height - innerHeight + 96);
    const value = Math.max(0, Math.min(100, ((scrollY - start) / distance) * 100));
    bar.style.transform = `scaleX(${value / 100})`;
    bar.setAttribute("aria-valuenow", String(Math.round(value)));
  };

  const schedule = onViewportScroll(signal, update);
  signal.addEventListener("abort", () => container.remove(), { once: true });
  schedule();
}

function attachHeadingLinks(article: HTMLElement) {
  const prefix = document.documentElement.lang === "en" ? "Jump to: " : "跳转到：";
  for (const heading of article.querySelectorAll<HTMLElement>(":scope > :is(h2,h3,h4,h5,h6)[id]")) {
    if (heading.querySelector(".heading-link")) continue;
    heading.classList.add("group");
    const link = document.createElement("a");
    link.className =
      "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";
    link.href = `#${heading.id}`;
    link.setAttribute("aria-label", `${prefix}${heading.textContent?.trim()}`);
    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.textContent = "#";
    link.appendChild(span);
    heading.appendChild(link);
  }
}

function attachCopyButtons(article: HTMLElement, signal: AbortSignal) {
  const blocks = [...article.querySelectorAll<HTMLElement>("pre")].filter(
    (block) => !block.closest(".not-prose") && block.querySelector("code"),
  );
  // Read computed offsets before mutating DOM to prevent per-block reflow thrashing.
  const hasOffsetByBlock = new Map(
    blocks.map((block) => [block, getComputedStyle(block).getPropertyValue("--file-name-offset").trim() !== ""]),
  );

  const ariaLabel = document.documentElement.lang === "en" ? "Copy code" : "复制代码";
  const failedLabel = document.documentElement.lang === "en" ? "Copy failed" : "复制失败";

  for (const block of blocks) {
    let button = block.querySelector<HTMLButtonElement>(".copy-code");
    if (!button) {
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      const hasOffset = hasOffsetByBlock.get(block) ?? false;
      button = document.createElement("button");
      button.type = "button";
      button.className = `copy-code absolute end-3 ${hasOffset ? "top-(--file-name-offset)" : "-top-3"} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium`;
      button.setAttribute("aria-label", ariaLabel);
      button.setAttribute("aria-live", "polite");
      block.setAttribute("tabindex", "0");
      block.appendChild(button);
      block.parentNode?.insertBefore(wrapper, block);
      wrapper.appendChild(block);
    }
    const copy = button;
    copy.textContent = "Copy";
    delete copy.dataset.copyState;
    let timer = 0;
    let sequence = 0;
    copy.addEventListener(
      "click",
      async () => {
        const token = ++sequence;
        clearTimeout(timer);
        try {
          await navigator.clipboard.writeText(block.querySelector("code")?.innerText ?? "");
          if (signal.aborted || token !== sequence) return;
          copy.textContent = "Copied";
          copy.dataset.copyState = "copied";
        } catch {
          if (signal.aborted || token !== sequence) return;
          copy.textContent = failedLabel;
          copy.dataset.copyState = "error";
        }
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          copy.textContent = "Copy";
          delete copy.dataset.copyState;
        }, 1200);
      },
      { signal },
    );
    signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  }
}

export function mountPostEnhancements(signal: AbortSignal) {
  const article = document.querySelector<HTMLElement>(".post-page #article");
  if (!article) return;
  setupProgressBar(article, signal);
  setupArticleFormatting(article);
  attachHeadingLinks(article);
  attachCopyButtons(article, signal);
  setupArticleToc(signal);
  setupArticleLightbox(signal);
  setupReadingControls(signal);
}

onAstroPage(mountPostEnhancements);
