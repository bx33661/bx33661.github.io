/** Canonical site origin without trailing slash (URL joins, schema). */
const SITE_ORIGIN = "https://www.bx33661.com";
const SITE_DESCRIPTION =
  "我是BX，欢迎来到我的博客！这里分享网络安全、CTF、Web安全等技术研究，和我一起学习、成长、分享，见证星辰大海！";

/**
 * Single source of truth for site metadata.
 * Prefer: website / desc / lang. Aliases (href / description / locale) kept for legacy imports.
 */
export const SITE = {
  website: `${SITE_ORIGIN}/`,
  /** Alias of website without trailing slash — used by legacy SEO components. */
  href: SITE_ORIGIN,
  author: "BX",
  profile: "https://github.com/bx33661",
  desc: SITE_DESCRIPTION,
  /** Alias of desc for components that still read SITE.description. */
  description: SITE_DESCRIPTION,
  title: "BX",
  ogImage: "brand/bx-logo-512.png",
  lightAndDarkMode: true,
  postPerIndex: 6,
  postPerPage: 8,
  // Legacy threshold (unused): all tag pages are noindex and omitted from sitemap.
  // Tags stay as on-site filters only — see blog/tags/* and sitemap.xml.ts.
  tagIndexMinPosts: Number.POSITIVE_INFINITY,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showGalleries: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: true,
    text: "编辑这篇文章",
    url: "https://github.com/bx33661/bx33661.github.io/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr" as const, // "rtl" | "auto"
  lang: "zh-CN",
  /** Alias of lang for legacy SEO components. */
  locale: "zh-CN",
  location: "China",
  timezone: "Asia/Shanghai",
  templateName: "astro-orbit",
  email: "bx33661@gmail.com",
  defaultAuthorId: "bx",
  brandLogo: "/brand/bx-logo.svg",
  ogKicker: "CYBERSECURITY / LLMS / NOTES",
  footerTagline: {
    zh: "记录网络安全与工程实践，持续分享真实可复现的技术经验。",
    en: "Notes on cybersecurity and engineering, grounded in reproducible work.",
  },
  footerColophon: {
    zh: "由热爱驱动，长期维护更新",
    en: "Built with curiosity. Maintained over time.",
  },
  friendCard: {
    name: "BX的博客",
    desc: "专注于安全研究和技术分享的个人博客",
    avatar: "/brand/bx-logo-192.png",
  },
  introAudio: {
    enabled: false,
    src: "/audio/intro-web.mp3",
    label: "INTRO.MP3",
    duration: 30,
  },
} as const;
