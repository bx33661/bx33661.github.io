type SearchEntry = {
  title: string;
  description?: string;
  slug: string;
  tags?: string[];
  content?: string;
};

type SearchOptions = {
  initialQuery?: string;
  limit?: number;
  onQueryChange?: (query: string) => void;
};

let entriesPromise: Promise<SearchEntry[]> | undefined;

async function getEntries(): Promise<SearchEntry[]> {
  entriesPromise ??= fetch("/search.json")
    .then((response) => {
      if (!response.ok) throw new Error(`Search index: ${response.status}`);
      return response.json() as Promise<SearchEntry[]>;
    })
    .catch((error) => {
      entriesPromise = undefined;
      throw error;
    });
  return entriesPromise;
}

/** Local development uses the existing JSON route; production uses Pagefind. */
export async function mountDevSearch(
  mount: HTMLElement,
  { initialQuery = "", limit = 8, onQueryChange }: SearchOptions = {},
): Promise<HTMLInputElement> {
  const form = document.createElement("form");
  form.className = "search-fallback-form";
  form.setAttribute("role", "search");

  const input = document.createElement("input");
  input.className = "search-fallback-input";
  input.type = "search";
  input.placeholder = "搜索文章、标签或关键词…";
  input.autocomplete = "off";
  input.setAttribute("aria-label", "站内搜索关键词");
  input.value = initialQuery;
  form.append(input);

  const status = document.createElement("p");
  status.className = "search-fallback-status";
  status.setAttribute("aria-live", "polite");

  const list = document.createElement("ul");
  list.className = "search-fallback-results";
  mount.replaceChildren(form, status, list);

  let entries: SearchEntry[] = [];
  try {
    entries = await getEntries();
  } catch {
    status.textContent = "搜索索引暂时不可用，请稍后重试。";
    return input;
  }

  const render = () => {
    const query = input.value.trim().toLocaleLowerCase();
    onQueryChange?.(input.value.trim());
    list.replaceChildren();
    if (!query) {
      status.textContent = "输入关键词，查找博客文章与技术记录。";
      return;
    }
    const allMatches = entries.filter((entry) =>
      [entry.title, entry.description, ...(entry.tags ?? []), entry.content]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query),
    );
    const matches = allMatches.slice(0, limit);
    status.textContent = matches.length
      ? `找到 ${allMatches.length} 条相关结果${allMatches.length > limit ? `（显示前 ${limit} 条）` : ""}`
      : "没有找到相关内容，试试更短的关键词。";
    for (const entry of matches) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `/blog/${encodeURIComponent(entry.slug)}/`;
      link.className = "search-fallback-link";
      const title = document.createElement("strong");
      title.textContent = entry.title;
      const description = document.createElement("span");
      description.textContent = entry.description || "查看文章";
      link.append(title, description);
      item.append(link);
      list.append(item);
    }
  };

  input.addEventListener("input", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    list.querySelector<HTMLAnchorElement>("a")?.click();
  });
  render();
  return input;
}
