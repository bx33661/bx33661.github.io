import { SITE } from "@/config.ts";
import type { APIContext } from "astro";
import {
  getAllNotes,
  getAllNoteSlugs,
  getAllPostSlugs,
  getAllTags,
} from "@/lib/data-utils";
import { getAllProjectDocs } from "@/utils/projects";
import { TAG_PATH_PREFIX, getTagPath } from "@/utils/tagPath";

function buildUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

function encodePathSegment(segment: string): string {
  return encodeURIComponent(segment);
}

export async function GET(context: APIContext) {
  try {
    const postSlugs = await getAllPostSlugs();
    const noteSlugs = await getAllNoteSlugs();
    const allNotes = await getAllNotes();
    const projectDocs = await getAllProjectDocs();
    const tags = await getAllTags();
    const site = context.site ?? SITE.website;
    const baseUrl = site.toString().endsWith("/")
      ? site.toString().slice(0, -1)
      : site.toString();
    const now = new Date().toISOString();

    const staticPages = [
      {
        url: buildUrl(baseUrl, "/"),
        lastmod: now,
        changefreq: "daily",
        priority: "1.0",
      },
      {
        url: buildUrl(baseUrl, "/blog/"),
        lastmod: now,
        changefreq: "daily",
        priority: "0.9",
      },
      {
        url: buildUrl(baseUrl, "/notes/"),
        lastmod: now,
        changefreq: "weekly",
        priority: "0.8",
      },
      {
        url: buildUrl(baseUrl, "/projects/"),
        lastmod: now,
        changefreq: "weekly",
        priority: "0.8",
      },
      {
        url: buildUrl(baseUrl, "/galleries/"),
        lastmod: now,
        changefreq: "weekly",
        priority: "0.8",
      },
      {
        url: buildUrl(baseUrl, "/about/"),
        lastmod: now,
        changefreq: "monthly",
        priority: "0.7",
      },
      {
        url: buildUrl(baseUrl, "/archives/"),
        lastmod: now,
        changefreq: "weekly",
        priority: "0.7",
      },
      {
        url: buildUrl(baseUrl, "/friends/"),
        lastmod: now,
        changefreq: "monthly",
        priority: "0.6",
      },
      {
        url: buildUrl(baseUrl, `${TAG_PATH_PREFIX}/`),
        lastmod: now,
        changefreq: "weekly",
        priority: "0.6",
      },
      {
        url: buildUrl(baseUrl, "/notes/list/"),
        lastmod: now,
        changefreq: "weekly",
        priority: "0.6",
      },
    ];

    const blogPosts = postSlugs.map(({ slug, post }) => ({
      url: buildUrl(baseUrl, `/blog/${encodePathSegment(slug)}/`),
      lastmod: post.data.pubDatetime.toISOString(),
      changefreq: "monthly",
      priority: "0.7",
    }));

    const notes = noteSlugs.map(({ slug, note }) => ({
      url: buildUrl(baseUrl, `/notes/${encodePathSegment(slug)}/`),
      lastmod: note.data.date.toISOString(),
      changefreq: "monthly",
      priority: "0.6",
    }));

    const projects = projectDocs.map((doc) => {
      const pathParts = doc.hrefPath.split("/").filter(Boolean);
      const encoded = pathParts.map(encodePathSegment).join("/");
      const last =
        doc.entry.data.modDatetime ??
        doc.entry.data.pubDatetime ??
        new Date();
      return {
        url: buildUrl(baseUrl, `/projects/${encoded}/`),
        lastmod: last.toISOString(),
        changefreq: "monthly" as const,
        priority: doc.isRoot ? "0.7" : "0.55",
      };
    });

    const notesPageSize = 10;
    const notesPageCount = Math.ceil(allNotes.length / notesPageSize);
    const notePages = Array.from(
      { length: Math.max(notesPageCount - 1, 0) },
      (_, index) => ({
        url: buildUrl(baseUrl, `/notes/list/${index + 2}/`),
        lastmod: now,
        changefreq: "weekly",
        priority: "0.5",
      }),
    );

    // 按 slug 路径聚合（合并大小写变体），只收录文章数达标的可索引标签页；
    // 薄标签页已 noindex，不应进 sitemap，否则给搜索引擎发矛盾信号。
    const tagCountByPath = new Map<string, number>();
    for (const [tag, count] of tags) {
      const path = getTagPath(tag);
      tagCountByPath.set(path, (tagCountByPath.get(path) ?? 0) + count);
    }
    const tagUrls = Array.from(tagCountByPath, ([path, count]) => ({
      url: buildUrl(baseUrl, path),
      lastmod: now,
      changefreq: "weekly",
      priority: count >= 5 ? "0.6" : "0.5",
    })).filter(entry => {
      const path = entry.url.replace(baseUrl, "");
      return (tagCountByPath.get(path) ?? 0) >= SITE.tagIndexMinPosts;
    });

    const allUrls = [
      ...staticPages,
      ...blogPosts,
      ...notes,
      ...projects,
      ...notePages,
      ...tagUrls,
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    // 静默处理错误，避免在生产环境中暴露敏感信息
    // 可选：发送到错误监控服务
    return new Response("Internal Server Error", { status: 500 });
  }
}
