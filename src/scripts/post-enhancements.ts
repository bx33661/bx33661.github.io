import { onAstroPage, onViewportScroll } from "./astro-lifecycle";
import { setupArticleToc } from "./article-toc";
import { setupArticleLightbox } from "./article-lightbox";
import { setupArticleFormatting } from "./article-formatting";
import { setupReadingControls } from "./reading-controls";
import { prefersReducedMotion } from "./reading-motion";

function setupProgressBar(article: HTMLElement, signal: AbortSignal) {
  const container = document.createElement("div");
  container.className = "progress-container pointer-events-none fixed top-0 z-50 h-[3px] w-full bg-transparent";
  const bar = document.createElement("div");
  bar.className = "progress-bar h-full w-full bg-accent";
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

function attachHeadingLinks(article: HTMLElement, signal: AbortSignal) {
  const isEnglish = document.documentElement.lang === "en";
  const labelPrefix = isEnglish ? "Copy section link: " : "复制章节链接：";
  const copiedLabel = isEnglish ? "Copied" : "已复制";

  for (const heading of article.querySelectorAll<HTMLElement>(":scope > :is(h2,h3,h4,h5,h6)[id]")) {
    let link = heading.querySelector<HTMLAnchorElement>(".heading-link");
    if (!link) {
      heading.classList.add("group");
      link = document.createElement("a");
      link.className =
        "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";
      link.href = `#${heading.id}`;
      const cleanTitle = heading.textContent?.replace(/#\s*$/, "").trim() ?? heading.id;
      link.setAttribute("aria-label", `${labelPrefix}${cleanTitle}`);
      link.setAttribute("title", `${labelPrefix}${cleanTitle}`);
      const span = document.createElement("span");
      span.ariaHidden = "true";
      span.textContent = "#";
      link.appendChild(span);
      heading.appendChild(link);
    }

    const anchor = link;
    anchor.dataset.copiedLabel = copiedLabel;
    let timer = 0;
    let sequence = 0;
    signal.addEventListener("abort", () => clearTimeout(timer), { once: true });

    anchor.addEventListener(
      "click",
      async (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const targetHash = `#${heading.id}`;
        history.replaceState(history.state, "", targetHash);
        heading.scrollIntoView({ behavior: prefersReducedMotion() ? "instant" : "smooth", block: "start" });

        const token = ++sequence;
        clearTimeout(timer);
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(new URL(targetHash, window.location.href).href);
          }
          if (signal.aborted || token !== sequence) return;
          anchor.dataset.copied = "true";
          timer = window.setTimeout(() => {
            if (!signal.aborted && token === sequence) delete anchor.dataset.copied;
          }, 1800);
        } catch {
          /* Clipboard may be restricted in non-HTTPS or denied contexts; hash navigation still succeeded. */
        }
      },
      { signal },
    );
  }
}

const CODE_LANGUAGE_LABELS = new Map<string, string>([
  ["ts", "TypeScript"],
  ["typescript", "TypeScript"],
  ["tsx", "TSX"],
  ["js", "JavaScript"],
  ["javascript", "JavaScript"],
  ["jsx", "JSX"],
  ["py", "Python"],
  ["python", "Python"],
  ["sh", "Bash"],
  ["bash", "Bash"],
  ["zsh", "Zsh"],
  ["shell", "Shell"],
  ["yml", "YAML"],
  ["yaml", "YAML"],
  ["json", "JSON"],
  ["ql", "CodeQL"],
  ["codeql", "CodeQL"],
  ["go", "Go"],
  ["java", "Java"],
  ["php", "PHP"],
  ["c", "C"],
  ["cpp", "C++"],
  ["c++", "C++"],
  ["rs", "Rust"],
  ["rust", "Rust"],
  ["sql", "SQL"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["http", "HTTP"],
  ["diff", "Diff"],
  ["dockerfile", "Dockerfile"],
  ["xml", "XML"],
  ["md", "Markdown"],
  ["markdown", "Markdown"],
  ["plaintext", "Code"],
  ["text", "Code"],
  ["txt", "Code"],
]);

function resolveCodeBlockLabel(block: HTMLElement): { text: string; isFile: boolean } {
  const fileBadge = block.querySelector<HTMLElement>("[data-code-filename]");
  if (fileBadge) {
    return {
      text: fileBadge.dataset.codeFilename || fileBadge.textContent?.trim() || "Code",
      isFile: true,
    };
  }
  const rawLang = (block.getAttribute("data-language") || "").trim().toLowerCase();
  if (!rawLang) return { text: "Code", isFile: false };
  return {
    text: CODE_LANGUAGE_LABELS.get(rawLang) || rawLang.toUpperCase(),
    isFile: false,
  };
}

function attachCopyButtons(article: HTMLElement, signal: AbortSignal) {
  const blocks = [...article.querySelectorAll<HTMLElement>("pre")].filter(
    (block) => !block.closest(".not-prose") && block.querySelector("code"),
  );

  const isEnglish = document.documentElement.lang === "en";
  const ariaLabel = isEnglish ? "Copy code" : "复制代码";
  const failedLabel = isEnglish ? "Copy failed" : "复制失败";
  const collapseLabel = isEnglish ? "Collapse code" : "收起代码";
  const expandLabelFor = (lines: number) =>
    isEnglish ? `Expand code (${lines} lines)` : `展开完整代码（共 ${lines} 行）`;

  for (const block of blocks) {
    let shell = block.parentElement?.classList.contains("code-block-shell") ? block.parentElement : null;
    if (!shell) {
      shell = document.createElement("div");
      shell.className = "code-block-shell";
      const header = document.createElement("div");
      header.className = "code-block-header";
      header.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      const meta = resolveCodeBlockLabel(block);
      label.className = meta.isFile ? "code-block-label is-file" : "code-block-label";
      label.textContent = meta.text;
      header.appendChild(label);
      block.parentNode?.insertBefore(shell, block);
      shell.appendChild(header);
      shell.appendChild(block);
    }

    if (block.dataset.codeCollapsible === "true") {
      const lineCount = Number(block.dataset.codeLines) || block.querySelectorAll("code .line").length;
      const expandLabel = expandLabelFor(lineCount);
      const isExpanded = block.dataset.codeExpanded === "true";
      shell.classList.add("is-collapsible");
      shell.classList.toggle("is-collapsed", !isExpanded);

      let toggle = shell.querySelector<HTMLButtonElement>(".code-block-toggle");
      if (!toggle) {
        const footer = document.createElement("div");
        footer.className = "code-block-footer";
        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "code-block-toggle";
        footer.appendChild(toggle);
        shell.appendChild(footer);
      }

      const headerEl = shell.querySelector<HTMLElement>(".code-block-header");
      let headerCollapse = shell.querySelector<HTMLButtonElement>(".code-block-header-collapse");
      if (!headerCollapse && headerEl) {
        headerCollapse = document.createElement("button");
        headerCollapse.type = "button";
        headerCollapse.className = "code-block-header-collapse";
        headerEl.appendChild(headerCollapse);
      }

      const toggleButton = toggle;
      const headerCollapseBtn = headerCollapse;
      const container = shell;

      const syncCollapsedUI = (expanded: boolean) => {
        container.classList.toggle("is-collapsed", !expanded);
        if (expanded) block.dataset.codeExpanded = "true";
        else delete block.dataset.codeExpanded;
        toggleButton.setAttribute("aria-expanded", String(expanded));
        toggleButton.textContent = expanded ? collapseLabel : expandLabel;
        if (headerCollapseBtn) {
          headerCollapseBtn.textContent = collapseLabel;
          headerCollapseBtn.hidden = !expanded;
        }
      };

      syncCollapsedUI(isExpanded);

      const handleToggle = () => {
        const nextExpanded = container.classList.contains("is-collapsed");
        syncCollapsedUI(nextExpanded);
        if (!nextExpanded && container.getBoundingClientRect().top < 88) {
          container.scrollIntoView({ behavior: prefersReducedMotion() ? "instant" : "smooth", block: "nearest" });
        }
      };

      toggleButton.addEventListener("click", handleToggle, { signal });
      headerCollapseBtn?.addEventListener("click", handleToggle, { signal });
    }

    let button = block.querySelector<HTMLButtonElement>(".copy-code");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code";
      button.setAttribute("aria-label", ariaLabel);
      button.setAttribute("aria-live", "polite");
      block.setAttribute("tabindex", "0");
      block.appendChild(button);
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

function setupHeaderUtilities(signal: AbortSignal) {
  const expandTagsBtn = document.querySelector<HTMLButtonElement>("[data-tags-expand]");
  if (expandTagsBtn) {
    expandTagsBtn.addEventListener(
      "click",
      () => {
        document.querySelectorAll<HTMLElement>("[data-extra-tag]").forEach((badge) => {
          badge.hidden = false;
        });
        expandTagsBtn.setAttribute("aria-expanded", "true");
        expandTagsBtn.hidden = true;
      },
      { signal },
    );
  }

  const mdButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-copy-article-md]")];
  const readingBarCopyBtn = document.querySelector<HTMLButtonElement>(".reading-bar-copy-btn");
  const sourceNode = document.getElementById("article-markdown-source");
  if (!mdButtons.length || !sourceNode?.textContent) {
    if (readingBarCopyBtn) readingBarCopyBtn.hidden = true;
    return;
  }
  if (readingBarCopyBtn) {
    readingBarCopyBtn.hidden = false;
    signal.addEventListener("abort", () => {
      readingBarCopyBtn.hidden = true;
    }, { once: true });
  }

  let cachedMarkdown: string | null = null;
  const readMarkdown = () => {
    if (cachedMarkdown !== null) return cachedMarkdown;
    try {
      cachedMarkdown = JSON.parse(sourceNode.textContent || '""') as string;
    } catch {
      cachedMarkdown = "";
    }
    return cachedMarkdown;
  };

  for (const btn of mdButtons) {
    let timer = 0;
    let sequence = 0;
    const textEl = btn.querySelector<HTMLElement>("[data-copy-md-text]");
    const defaultLabel = btn.dataset.labelDefault || "Copy Markdown";
    const copiedLabel = btn.dataset.labelCopied || "Copied ✓";

    btn.addEventListener(
      "click",
      async () => {
        const markdown = readMarkdown();
        if (!markdown || !navigator.clipboard?.writeText) return;
        const token = ++sequence;
        clearTimeout(timer);
        try {
          await navigator.clipboard.writeText(markdown);
          if (signal.aborted || token !== sequence) return;
          btn.dataset.copied = "true";
          if (textEl) textEl.textContent = copiedLabel;
          timer = window.setTimeout(() => {
            if (signal.aborted || token !== sequence) return;
            delete btn.dataset.copied;
            if (textEl) textEl.textContent = defaultLabel;
          }, 1600);
        } catch {
          /* Clipboard restricted; leave button unchanged. */
        }
      },
      { signal },
    );
    signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  }
}

function setupFootnotePopovers(article: HTMLElement, signal: AbortSignal) {
  const refs = [...article.querySelectorAll<HTMLAnchorElement>("a[data-footnote-ref][href^='#']")];
  if (!refs.length) return;

  let popover: HTMLElement | null = null;
  let activeRef: HTMLAnchorElement | null = null;
  let hideTimer = 0;

  const dismiss = () => {
    clearTimeout(hideTimer);
    if (popover) {
      popover.hidden = true;
      popover.replaceChildren();
    }
    activeRef = null;
  };

  const ensurePopover = () => {
    if (popover) return popover;
    popover = document.createElement("aside");
    popover.className = "article-footnote-popover";
    popover.setAttribute("role", "note");
    popover.setAttribute("data-pagefind-ignore", "");
    popover.hidden = true;
    popover.addEventListener("pointerenter", () => clearTimeout(hideTimer), { signal });
    popover.addEventListener(
      "pointerleave",
      () => {
        hideTimer = window.setTimeout(dismiss, 140);
      },
      { signal },
    );
    document.body.appendChild(popover);
    signal.addEventListener("abort", () => popover?.remove(), { once: true });
    return popover;
  };

  const showFor = (ref: HTMLAnchorElement) => {
    clearTimeout(hideTimer);
    const targetId = decodeURIComponent(ref.hash.slice(1));
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;

    const card = ensurePopover();
    card.replaceChildren();

    const badge = document.createElement("span");
    badge.className = "article-footnote-popover-num";
    badge.textContent = `[${ref.textContent?.trim() || "*"}]`;

    const body = document.createElement("div");
    body.className = "article-footnote-popover-body";
    const clone = target.cloneNode(true) as HTMLElement;
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    clone.querySelectorAll("[data-footnote-backref]").forEach((el) => el.remove());
    while (clone.firstChild) body.appendChild(clone.firstChild);

    card.append(badge, body);
    card.hidden = false;
    activeRef = ref;

    const refBox = ref.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    const margin = 12;
    let left = refBox.left + refBox.width / 2 - cardBox.width / 2;
    left = Math.max(margin, Math.min(innerWidth - cardBox.width - margin, left));

    const preferAbove = refBox.top >= cardBox.height + 18;
    const top = preferAbove ? refBox.top - cardBox.height - 8 : Math.min(innerHeight - cardBox.height - margin, refBox.bottom + 8);
    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(Math.max(margin, top))}px`;
  };

  for (const ref of refs) {
    ref.addEventListener(
      "pointerenter",
      (event) => {
        if (event.pointerType === "mouse") showFor(ref);
      },
      { signal },
    );
    ref.addEventListener(
      "pointerleave",
      (event) => {
        if (event.pointerType === "mouse") {
          hideTimer = window.setTimeout(dismiss, 140);
        }
      },
      { signal },
    );
    ref.addEventListener("focus", () => showFor(ref), { signal });
    ref.addEventListener("blur", () => {
      hideTimer = window.setTimeout(dismiss, 100);
    }, { signal });
    ref.addEventListener("click", dismiss, { signal });
  }

  window.addEventListener("scroll", () => {
    if (activeRef) dismiss();
  }, { passive: true, signal });
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && activeRef && !document.querySelector("dialog[open]")) {
        dismiss();
      }
    },
    { signal },
  );
  signal.addEventListener("abort", () => clearTimeout(hideTimer), { once: true });
}

export function mountPostEnhancements(signal: AbortSignal) {
  const article = document.querySelector<HTMLElement>(".post-page #article");
  if (!article) return;
  setupProgressBar(article, signal);
  setupHeaderUtilities(signal);
  setupArticleFormatting(article);
  attachHeadingLinks(article, signal);
  attachCopyButtons(article, signal);
  setupFootnotePopovers(article, signal);
  setupArticleToc(signal);
  setupArticleLightbox(signal);
  setupReadingControls(signal);
}

onAstroPage(mountPostEnhancements);
