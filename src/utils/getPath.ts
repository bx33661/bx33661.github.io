import { BLOG_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";

/**
 * Get full path of a blog post.
 * When `customSlug` is provided (all canonical blog routes), avoid directory traversal work.
 */
export function getPath(id: string, filePath: string | undefined, includeBase = true, customSlug?: string): string {
  const basePath = includeBase ? "/blog" : "";
  if (customSlug) {
    return `${basePath}/${customSlug}/`;
  }

  const pathSegments = filePath
    ?.replace(BLOG_PATH, "")
    .split("/")
    .filter((path) => path !== "" && !path.startsWith("_"))
    .slice(0, -1)
    .map((segment) => slugifyStr(segment));

  const blogId = id.split("/");
  const slug = blogId[blogId.length - 1] ?? id;

  if (!pathSegments || pathSegments.length < 1) {
    return `${basePath}/${slug}/`;
  }

  return `${[basePath, ...pathSegments, slug].join("/")}/`;
}
