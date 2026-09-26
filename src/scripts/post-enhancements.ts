/**
 * Progressive enhancements for post details:
 * - Scroll progress bar
 * - Heading permalinks (#)
 * - Code block copy buttons
 * - Scroll to top on navigation swap
 */

function setupProgressBar() {
  let progressContainer = document.querySelector(".progress-container");
  if (!progressContainer) {
    progressContainer = document.createElement("div");
    progressContainer.className =
      "progress-container fixed top-0 z-50 h-1 w-full bg-background";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar h-1 w-0 bg-accent";
    progressBar.id = "myBar";
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);
  }

  const updateProgress = () => {
    const winScroll =
      document.body.scrollTop || document.documentElement.scrollTop;
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    const bar = document.getElementById("myBar");
    if (bar) bar.style.width = `${scrolled}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();
}

function attachHeadingLinks() {
  const headings = Array.from(
    document.querySelectorAll<HTMLElement>(
      "article h2, article h3, article h4, article h5, article h6",
    ),
  );
  for (const heading of headings) {
    if (heading.querySelector(".heading-link")) continue;
    heading.classList.add("group");
    const link = document.createElement("a");
    link.className =
      "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";
    link.href = `#${heading.id}`;
    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";
    link.appendChild(span);
    link.ariaLabel = "link to heading";
    heading.appendChild(link);
  }
}

function attachCopyButtons() {
  const copyButtonLabel = "Copy";
  const codeBlocks = Array.from(document.querySelectorAll<HTMLElement>("pre"));

  for (const codeBlock of codeBlocks) {
    if (codeBlock.querySelector(".copy-code")) continue;
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const computedStyle = getComputedStyle(codeBlock);
    const hasFileNameOffset =
      computedStyle.getPropertyValue("--file-name-offset").trim() !== "";

    const topClass = hasFileNameOffset
      ? "top-(--file-name-offset)"
      : "-top-3";

    const copyButton = document.createElement("button");
    copyButton.className = `copy-code absolute end-3 ${topClass} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium`;
    copyButton.innerHTML = copyButtonLabel;
    codeBlock.setAttribute("tabindex", "0");
    codeBlock.appendChild(copyButton);

    codeBlock?.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);

    copyButton.addEventListener("click", async () => {
      const code = codeBlock.querySelector("code");
      const text = code?.innerText;
      await navigator.clipboard.writeText(text ?? "");
      copyButton.innerText = "Copied";
      setTimeout(() => {
        copyButton.innerText = copyButtonLabel;
      }, 700);
    });
  }
}

export function initPostEnhancements() {
  setupProgressBar();
  attachHeadingLinks();
  attachCopyButtons();
}

document.addEventListener("astro:page-load", initPostEnhancements);
document.addEventListener("astro:after-swap", () =>
  window.scrollTo({ left: 0, top: 0, behavior: "instant" }),
);
