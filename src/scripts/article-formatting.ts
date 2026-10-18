/** Raw HTML/JSX content gets the same regions as server-rendered Markdown. */
export function setupArticleFormatting(article: HTMLElement) {
  const isEnglish = document.documentElement.lang === "en";
  const labels = {
    table: isEnglish ? "Table; scroll horizontally" : "表格，可横向滚动",
    math: isEnglish ? "Math formula; scroll horizontally" : "数学公式，可横向滚动",
    inlineMath: isEnglish ? "Inline formula; scroll horizontally" : "行内公式，可横向滚动",
  };
  // The parser is shared too; localize existing server-rendered region labels.
  if (isEnglish) {
    for (const [selector, label] of [
      [".article-table-scroll", labels.table],
      [".article-math-block", labels.math],
      [".article-inline-math", labels.inlineMath],
    ]) article.querySelectorAll(selector).forEach((region) => region.setAttribute("aria-label", label));
    const footnoteHeading = article.querySelector(".footnotes h2");
    if (footnoteHeading) footnoteHeading.textContent = "Footnotes";
    article.querySelectorAll("[data-footnote-backref]").forEach((link) => link.setAttribute("aria-label", "Back to content"));
  }
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
      wrap(table, "article-table-scroll", labels.table),
    );
  article
    .querySelectorAll<HTMLElement>(".katex-display")
    .forEach((math) =>
      wrap(math, "article-math-block", labels.math),
    );
  article.querySelectorAll<HTMLElement>(".katex").forEach((math) => {
    if (!math.closest(".katex-display"))
      wrap(math, "article-inline-math", labels.inlineMath, true);
  });
}
