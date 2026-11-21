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
      const toggleButton = toggle;
      toggleButton.setAttribute("aria-expanded", String(isExpanded));
      toggleButton.textContent = isExpanded ? collapseLabel : expandLabel;
      const container = shell;
      toggleButton.addEventListener(
        "click",
        () => {
          const nextCollapsed = container.classList.toggle("is-collapsed");
          const nextExpanded = !nextCollapsed;
          if (nextExpanded) block.dataset.codeExpanded = "true";
          else delete block.dataset.codeExpanded;
          toggleButton.setAttribute("aria-expanded", String(nextExpanded));
          toggleButton.textContent = nextExpanded ? collapseLabel : expandLabel;
          if (nextCollapsed && container.getBoundingClientRect().top < 88) {
            container.scrollIntoView({ behavior: prefersReducedMotion() ? "instant" : "smooth", block: "nearest" });
          }
        },
        { signal },
      );
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
