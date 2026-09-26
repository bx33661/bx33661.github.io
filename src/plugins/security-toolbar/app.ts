import { defineToolbarApp } from "astro/toolbar";

type ScanResult = {
  isArticle: boolean;
  title: string;
  slug: string;
  slugValid: boolean;
  wordCount: number;
  readingTimeMin: number;
  ipLeaks: string[];
  tokenLeaks: string[];
  imageIssues: string[];
  canonical: string;
  robots: string;
  pagefindBody: boolean;
};

export default defineToolbarApp({
  init(canvas, app) {
    const windowEl = document.createElement("astro-dev-toolbar-window");
    const container = document.createElement("div");
    container.className = "auditor-panel";

    const style = document.createElement("style");
    style.textContent = `
      .auditor-panel {
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #e2e8f0;
        padding: 1.25rem;
        width: 420px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        box-sizing: border-box;
      }
      .auditor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      }
      .auditor-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .auditor-badge {
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.15rem 0.4rem;
        border-radius: 0.25rem;
        background: #3b82f6;
        color: #ffffff;
      }
      .rescan-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e2e8f0;
        border-radius: 0.35rem;
        padding: 0.3rem 0.6rem;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .rescan-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #ffffff;
      }
      .section-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        padding: 0.85rem;
        margin-bottom: 0.75rem;
      }
      .section-card h4 {
        margin: 0 0 0.5rem;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .status-pill {
        font-size: 0.68rem;
        padding: 0.1rem 0.35rem;
        border-radius: 9999px;
        font-weight: 650;
      }
      .status-ok { background: rgba(16, 185, 129, 0.2); color: #34d399; }
      .status-warn { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
      .status-err { background: rgba(239, 68, 68, 0.2); color: #f87171; }
      .data-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        padding: 0.25rem 0;
        border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
      }
      .data-row:last-child {
        border-bottom: none;
      }
      .data-label { color: #94a3b8; }
      .data-val { font-weight: 550; color: #f1f5f9; text-align: right; word-break: break-all; max-width: 60%; }
      .issue-list {
        margin: 0.4rem 0 0;
        padding-left: 1.2rem;
        font-size: 0.78rem;
        color: #f87171;
      }
      .issue-list li { margin-bottom: 0.2rem; }
    `;

    container.innerHTML = `
      <header class="auditor-header">
        <h3 class="auditor-title">
          <span>🛡️ 安全与文章巡检</span>
          <span class="auditor-badge">DEV AUDIT</span>
        </h3>
        <button class="rescan-btn" id="btn-rescan" type="button">刷新检测</button>
      </header>
      <div id="auditor-body"></div>
    `;

    canvas.append(style, windowEl);
    windowEl.append(container);

    function scan(): ScanResult {
      const article = document.querySelector("#article, main article, .app-prose");
      const isArticle = Boolean(article);
      const titleEl = document.querySelector("h1");
      const title = titleEl?.textContent?.trim() || document.title;

      const path = window.location.pathname.replace(/^\/|\/$/g, "");
      const segments = path.split("/");
      const slug = segments[segments.length - 1] || "home";
      const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug === "home";

      let wordCount = 0;
      let readingTimeMin = 0;
      const ipLeaks: string[] = [];
      const tokenLeaks: string[] = [];
      const imageIssues: string[] = [];

      if (isArticle && article) {
        const text = article.textContent || "";
        const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const words = (text.replace(/[\u4e00-\u9fa5]/g, " ").match(/[a-zA-Z0-9_-]+/g) || []).length;
        wordCount = cjk + words;
        readingTimeMin = Math.max(1, Math.ceil(wordCount / 350));

        // Scan for potential IP leaks
        const ipMatches = text.match(/\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|43\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g) || [];
        ipLeaks.push(...Array.from(new Set(ipMatches)));

        // Scan for API tokens
        const tokenMatches = text.match(/\b(?:sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{36})\b/g) || [];
        tokenLeaks.push(...Array.from(new Set(tokenMatches)));

        // Scan images
        article.querySelectorAll("img").forEach((img) => {
          const src = img.getAttribute("src") || "";
          if (src.includes("%20") || src.includes(" ") || /\bimage\s*\d+\.png/i.test(src)) {
            imageIssues.push(`包含空格或非标准命名: ${src.split("/").pop()}`);
          }
          if (!img.getAttribute("alt")?.trim()) {
            imageIssues.push(`缺失 alt 文本: ${src.split("/").pop()}`);
          }
        });
      }

      const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || "未声明";
      const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content || "未声明";
      const pagefindBody = Boolean(document.querySelector("[data-pagefind-body]"));

      return {
        isArticle,
        title,
        slug,
        slugValid,
        wordCount,
        readingTimeMin,
        ipLeaks,
        tokenLeaks,
        imageIssues,
        canonical,
        robots,
        pagefindBody,
      };
    }

    function render(res: ScanResult) {
      const body = container.querySelector("#auditor-body");
      if (!body) return;

      const hasSecLeak = res.ipLeaks.length > 0 || res.tokenLeaks.length > 0;
      const hasQualityIssue = !res.slugValid || res.imageIssues.length > 0;

      if (hasSecLeak) {
        app.toggleNotification({ state: true, level: "error" });
      } else if (hasQualityIssue) {
        app.toggleNotification({ state: true, level: "warning" });
      } else {
        app.toggleNotification({ state: false });
      }

      const secStatusPill = hasSecLeak
        ? `<span class="status-pill status-err">发现泄露风险</span>`
        : `<span class="status-pill status-ok">安全无泄露</span>`;

      const slugStatusPill = res.slugValid
        ? `<span class="status-pill status-ok">kebab-case 合规</span>`
        : `<span class="status-pill status-err">非标准 Slug</span>`;

      body.innerHTML = `
        <!-- Section: Security Guard -->
        <div class="section-card">
          <h4><span>🔒 敏感信息与安全巡查</span>${secStatusPill}</h4>
          ${
            hasSecLeak
              ? `
                ${res.ipLeaks.length ? `<p style="margin:0.2rem 0;color:#f87171;font-size:0.78rem;">发现内部/测试 IP 暴露:</p><ul class="issue-list">${res.ipLeaks.map((ip) => `<li>${ip}</li>`).join("")}</ul>` : ""}
                ${res.tokenLeaks.length ? `<p style="margin:0.2rem 0;color:#f87171;font-size:0.78rem;">发现疑似 API Key/Token:</p><ul class="issue-list">${res.tokenLeaks.map((t) => `<li>${t.slice(0, 8)}...</li>`).join("")}</ul>` : ""}
              `
              : `<div class="data-row"><span class="data-label">私有 IP / Token</span><span class="data-val" style="color:#34d399;">未检测到硬编码风险</span></div>`
          }
        </div>

        <!-- Section: Article Metadata -->
        <div class="section-card">
          <h4><span>📝 文章与元数据规范</span>${res.isArticle ? `<span class="status-pill status-ok">文章页面</span>` : `<span class="status-pill status-warn">非文章路由</span>`}</h4>
          <div class="data-row"><span class="data-label">URL Slug</span><span class="data-val">${res.slug}</span></div>
          <div class="data-row"><span class="data-label">Slug 规范</span><span class="data-val">${slugStatusPill}</span></div>
          ${
            res.isArticle
              ? `
                <div class="data-row"><span class="data-label">正文字数统计</span><span class="data-val">约 ${res.wordCount} 字</span></div>
                <div class="data-row"><span class="data-label">预计阅读时长</span><span class="data-val">${res.readingTimeMin} 分钟</span></div>
              `
              : ""
          }
          ${
            res.imageIssues.length
              ? `<p style="margin:0.4rem 0 0.2rem;color:#fbbf24;font-size:0.78rem;">图片资产规范问题:</p><ul class="issue-list">${res.imageIssues.map((issue) => `<li style="color:#fbbf24;">${issue}</li>`).join("")}</ul>`
              : `<div class="data-row"><span class="data-label">图片资产规范</span><span class="data-val" style="color:#34d399;">符合规范</span></div>`
          }
        </div>

        <!-- Section: SEO & Pagefind -->
        <div class="section-card">
          <h4><span>🔍 SEO 与搜索引擎索引</span><span class="status-pill ${res.pagefindBody ? "status-ok" : "status-warn"}">${res.pagefindBody ? "已开启正文索引" : "无 Pagefind 标记"}</span></h4>
          <div class="data-row"><span class="data-label">Canonical URL</span><span class="data-val">${res.canonical}</span></div>
          <div class="data-row"><span class="data-label">Robots 状态</span><span class="data-val">${res.robots}</span></div>
          <div class="data-row"><span class="data-label">Pagefind Index</span><span class="data-val">${res.pagefindBody ? "data-pagefind-body 启用" : "未挂载 body 标签"}</span></div>
        </div>
      `;
    }

    function runScan() {
      const result = scan();
      render(result);
    }

    container.querySelector("#btn-rescan")?.addEventListener("click", runScan);

    // Initial scan
    runScan();

    // Re-scan when client navigates with ClientRouter
    document.addEventListener("astro:page-load", runScan);
  },
});
