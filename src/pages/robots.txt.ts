import type { APIRoute } from 'astro'

const getRobotsTxt = (sitemapURL: URL, sitemapIndexURL: URL, imageSitemapURL: URL) => `
User-agent: *
Allow: /

# 禁止访问管理和临时文件
Disallow: /admin/
Disallow: /api/
Disallow: /.well-known/
Disallow: /temp/
Disallow: /tmp/

# 允许重要的SEO文件
Allow: /sitemap.xml
Allow: /sitemap-index.xml
Allow: /image-sitemap.xml
Allow: /robots.txt
Allow: /favicon.ico
Allow: /.well-known/security.txt

# 爬虫访问延迟（礼貌性设置）
Crawl-delay: 1

# 主站点地图
Sitemap: ${sitemapIndexURL.href}
Sitemap: ${sitemapURL.href}
Sitemap: ${imageSitemapURL.href}

# 百度爬虫特殊设置
User-agent: Baiduspider
Allow: /
Crawl-delay: 2

# Google爬虫优化
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# 360搜索爬虫
User-agent: 360Spider
Allow: /
Crawl-delay: 2

# 搜狗爬虫
User-agent: Sogou web spider
Allow: /
Crawl-delay: 2
`

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap.xml', site)
  const sitemapIndexURL = new URL('sitemap-index.xml', site)
  const imageSitemapURL = new URL('image-sitemap.xml', site)
  return new Response(getRobotsTxt(sitemapURL, sitemapIndexURL, imageSitemapURL))
}
