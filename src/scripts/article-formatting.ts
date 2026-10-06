/** Raw HTML/JSX content gets the same regions as server-rendered Markdown. */
export function setupArticleFormatting(article: HTMLElement) {
  const wrap = (
    target: HTMLElement,
    kind: string,
    label: string,
    inline = false,
  ) => {
    if (
      target.closest(".not-prose") ||
      target.parentElement?.classList.contains(kind)
    )
      return;
    const region = document.createElement(inline ? "span" : "div");
    region.className = kind;
    region.tabIndex = 0;
    if (!inline) region.setAttribute("role", "region");
    region.setAttribute("aria-label", label);
    target.replaceWith(region);
    region.appendChild(target);
  };
  article
    .querySelectorAll<HTMLElement>("table")
    .forEach((table) =>
      wrap(table, "article-table-scroll", "表格，可横向滚动"),
    );
  article
    .querySelectorAll<HTMLElement>(".katex-display")
    .forEach((math) =>
      wrap(math, "article-math-block", "数学公式，可横向滚动"),
    );
  article.querySelectorAll<HTMLElement>(".katex").forEach((math) => {
    if (!math.closest(".katex-display"))
      wrap(math, "article-inline-math", "行内公式，可横向滚动", true);
  });
}
