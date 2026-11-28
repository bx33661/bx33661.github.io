/**
 * Astro Orbit — Single Source of Truth for Site Configuration.
 *
 * IMPORTANT: `astro.config.ts` imports this file directly at config evaluation time,
 * so keep this file pure TypeScript with NO `@/` path-alias imports.
 */

export type SiteLocale = "en" | "zh-CN";
export type ThemePreset = "cobalt" | "emerald" | "amber" | "violet" | "rose" | "slate";
export type ThemeDefaultMode = "system" | "light" | "dark";
export type SocialIconName = "github" | "x" | "linkedin" | "mail" | "telegram" | "globe" | "rss";
export type ShareChannel = "x" | "telegram" | "whatsapp" | "facebook" | "pinterest" | "mail";

export interface SocialLinkConfig {
  name: string;
  href: string;
  icon: SocialIconName;
  label?: string;
}

export interface HomeLocaleCopy {
  pageTitle: string;
  eyebrow: string;
  greetingPrefix: string;
  greetingHighlight: string;
  welcome: string;
  horizonTag: string;
  focusLeadPrefix: string;
  focusLeadStrong: string;
  focusLeadSuffix: string;
  introParagraphs: readonly string[];
  closing: string;
  closingEmoji?: string;
  monographLang?: SiteLocale;
  focusHeading?: string;
  readBlogLabel?: string;
  readNotesLabel?: string;
  observatoryTitle: string;
  observatoryStatus: string;
  observatoryCaptionLeft: string;
  observatoryCaptionRight: string;
  focusTopics: readonly string[];
}

const SITE_ORIGIN = "https://astro-orbit.example.com";
const SITE_BASE = "/";
const SITE_PROFILE = "https://github.com/your-username";
const SITE_EMAIL = "hello@example.com";
const DEFAULT_LOCALE: SiteLocale = "en";
const BILINGUAL = true;
const THEME_PRESET: ThemePreset = "cobalt";
const THEME_DEFAULT_MODE: ThemeDefaultMode = "system";

const FEATURES: {
  notes: boolean;
  projects: boolean;
  friends: boolean;
  galleries: boolean;
  archives: boolean;
  search: boolean;
  githubHeatmap: boolean;
  pwa: boolean;
  dynamicOgImage: boolean;
  lightAndDarkMode: boolean;
  showBackButton: boolean;
} = {
  notes: true,
  projects: true,
  friends: true,
  galleries: true,
  archives: true,
  search: true,
  githubHeatmap: true,
  pwa: true,
  dynamicOgImage: true,
  lightAndDarkMode: true,
  showBackButton: true,
};

const SITE_DESCRIPTION =
  "A bilingual editorial technical blog and personal knowledge base template built with Astro 7, Tailwind CSS 4, MDX, and Pagefind.";
const SITE_DESCRIPTION_ZH =
  "基于 Astro 7、Tailwind CSS 4、MDX 与 Pagefind 构建的双语学术风技术博客与知识库模板。";

export const SITE = {
  /** Canonical site origin with trailing slash (used by Astro `site` and URL helpers). */
  website: `${SITE_ORIGIN}/`,
  /** Alias of website without trailing slash. */
  href: SITE_ORIGIN,
  /** Base path for subpath deployments (e.g. "/astro-orbit/"). */
  base: SITE_BASE,
  title: "Astro Orbit",
  author: "Orbit Author",
  defaultAuthorId: "orbit",
  /** Author aliases normalized to `SITE.author` across entries. */
  authorAliases: ["orbit", "author"] as readonly string[],
  profile: SITE_PROFILE,
  email: SITE_EMAIL,
  location: "Earth",
  timezone: "UTC",
  templateName: "astro-orbit",

  desc: SITE_DESCRIPTION,
  descZh: SITE_DESCRIPTION_ZH,
  description: SITE_DESCRIPTION,

  /** Brand & social icons under `public/`. */
  ogImage: "brand/orbit-logo-512.png",
  brandLogo: "/brand/orbit-logo.svg",
  faviconSvg: "/brand/orbit-logo.svg",
  faviconPng: "/brand/orbit-logo-32.png",
  appleTouchIcon: "/brand/apple-touch-icon.png",
  faviconIco: "/brand/favicon.ico",
  ogKicker: "ENGINEERING / NOTES / RESEARCH",

  /** Language & bilingual routing settings. */
  i18n: {
    defaultLocale: DEFAULT_LOCALE as SiteLocale,
    bilingual: BILINGUAL as boolean,
  },
  dir: "ltr" as const,
  lang: DEFAULT_LOCALE,
  locale: DEFAULT_LOCALE,

  /** Accent color preset & default light/dark theme mode. */
  theme: {
    preset: THEME_PRESET as ThemePreset,
    defaultMode: THEME_DEFAULT_MODE as ThemeDefaultMode,
    /** Optional 6-digit hex overrides (e.g. "#2563eb"). Leave empty to use the preset above. */
    accentLight: "" as string,
    accentDark: "" as string,
  },

  /** Social links rendered in the Footer and Projects header (empty href entries are skipped). */
  socials: [
    { name: "GitHub", href: SITE_PROFILE, icon: "github" as SocialIconName },
    { name: "Mail", href: `mailto:${SITE_EMAIL}`, icon: "mail" as SocialIconName },
  ] as readonly SocialLinkConfig[],

  /** Share channels displayed below posts (empty array hides third-party share buttons while keeping Copy Link). */
  shareLinks: ["x", "telegram", "whatsapp", "facebook", "mail"] as readonly ShareChannel[],

  /** Modular feature toggles. */
  features: FEATURES,
  lightAndDarkMode: FEATURES.lightAndDarkMode,
  showArchives: FEATURES.archives,
  showGalleries: FEATURES.galleries,
  showBackButton: FEATURES.showBackButton,
  dynamicOgImage: FEATURES.dynamicOgImage,

  /** Pagination & discovery settings. */
  postPerIndex: 6,
  postPerPage: 8,
  topicMinPosts: 1,
  tagIndexMinPosts: Number.POSITIVE_INFINITY,
  scheduledPostMargin: 15 * 60 * 1000,

  /** "Edit this page" link on article footers. */
  editPost: {
    enabled: true,
    text: {
      en: "Edit this page",
      zh: "编辑这篇文章",
    },
    url: "https://github.com/your-username/astro-orbit/edit/main/",
  },

  /** Homepage copy & observatory dossier configuration. */
  home: {
    en: {
      pageTitle: "Astro Orbit · Editorial Technical Blog & Knowledge Base",
      eyebrow: "A LITTLE CORNER OF THE INTERNET",
      greetingPrefix: "Hey, I'm ",
      greetingHighlight: "Orbit.",
      welcome: "Welcome to my digital observatory.",
      horizonTag: "CURIOSITY, IN ORBIT",
      focusLeadPrefix: "I write about ",
      focusLeadStrong: "software engineering, systems, and design",
      focusLeadSuffix: ", while staying curious about open tools and thoughtful craft.",
      introParagraphs: [
        "This is my corner of the internet where I document what I build, explore, and learn. Most entries cover engineering notes, deep dives, and reproducible experiments.",
        "Not every post claims to be final. Writing here reflects my understanding at a specific point in time—as ideas evolve, I revisit, refine, and update notes along the way.",
        "I hope this space gradually accumulates useful traces of exploration: clear explanations, diagrams, code snippets, and quiet reflections.",
        "Feel free to explore the posts, browse short study notes, or search across everything locally with zero external dependencies.",
      ],
      closing: "Let's explore the craft of building together.",
      observatoryTitle: "ORBIT // DEEP FIELD",
      observatoryStatus: "IN ORBIT",
      observatoryCaptionLeft: "ENGINEERING · WRITING",
      observatoryCaptionRight: "AD ASTRA · 01",
      focusTopics: ["Astro", "Markdown", "Engineering", "Design"],
    },
    zh: {
      pageTitle: "Astro Orbit · 双语技术博客与个人知识库",
      eyebrow: "A LITTLE CORNER OF THE INTERNET",
      greetingPrefix: "你好，这里是 ",
      greetingHighlight: "Orbit。",
      welcome: "欢迎来到我的数字星图与技术笔记空间。",
      horizonTag: "CURIOSITY, IN ORBIT",
      focusLeadPrefix: "目前专注于 ",
      focusLeadStrong: "软件工程、系统设计与开源工具",
      focusLeadSuffix: "，同时对一切有趣的技术与未知保持好奇。",
      introParagraphs: [
        "这是我在互联网上的自留地，用来记录学习、实践与思考的过程。大多数内容围绕技术展开，包括专题研究、工程手记与可复现的实验记录。",
        "我并不期待每一篇文章都给出终极答案；很多记录只是某个阶段的理解切片。随着认识深入，我会回来修订、补充与打磨这些文字。",
        "希望这个博客能成为思路与经验慢慢沉淀的空间，留下持续探索与成长的轨迹。",
        "欢迎四处逛逛：你可以按主题浏览文章、翻看短笔记，或随时使用全站本地搜索。",
      ],
      closing: "一起去往更远的地方，见证星辰大海。",
      observatoryTitle: "ORBIT // DEEP FIELD",
      observatoryStatus: "IN ORBIT",
      observatoryCaptionLeft: "ENGINEERING · NOTES",
      observatoryCaptionRight: "AD ASTRA · 01",
      focusTopics: ["Astro", "Markdown", "工程实践", "指南"],
    },
  } as { en: HomeLocaleCopy; zh: HomeLocaleCopy },

  /** Projects page copy (/projects/). */
  projectsPage: {
    en: {
      title: "Projects",
      description: "Open-source tools, experiments, and templates maintained with care.",
      leadEn: "Engineer & maker. Builder of small, sharp tools.",
      leadSub: "Open-source templates, CLI utilities, and reproducible writing workflows.",
    },
    zh: {
      title: "项目",
      description: "长期维护的开源项目、CLI 工具与实验作品。",
      leadEn: "Engineer & maker. Builder of small, sharp tools.",
      leadSub: "围绕工程效率、静态站点与日常工具链，做一些自己每天都在用的小项目。",
    },
  },

  /** Friends page copy (/friends/). */
  friendsPage: {
    en: {
      title: "Friends",
      description: "Independent blogs, communities, and tools worth bookmarking.",
      eyebrow: "NETWORK / COMMUNITY",
      headingLine1: "Friends,",
      headingEmphasis: "in orbit",
      subtitle: "Independent sites · Builders · Worth revisiting",
      lead: "Good people. Interesting corners of the web.",
      exchangeTitle: "One more good corner?",
      exchangeDesc:
        "If you write about engineering, design, or anything you care deeply about, feel free to reach out and exchange links.",
      exchangeHint: "Include your name, URL, one-line intro, and avatar.",
    },
    zh: {
      title: "友情链接",
      description: "独立博客、技术社区与值得收藏的站点集合。",
      eyebrow: "NETWORK / COMMUNITY",
      headingLine1: "Friends,",
      headingEmphasis: "in orbit",
      subtitle: "朋友们 · 同行者 · 值得反复访问的站点",
      lead: "Good people. Interesting corners of the web.",
      exchangeTitle: "欢迎交换友链",
      exchangeDesc: "如果你也在认真记录技术、设计或思考，欢迎来信交流并把你的站点放进轨道。",
      exchangeHint: "来信请附站点名称、URL、一句话简介与头像链接。",
    },
  },

  footerTagline: {
    en: "Notes on engineering, design, and reproducible craft.",
    zh: "记录工程实践与思考，持续分享真实可复现的技术经验。",
  },
  footerColophon: {
    en: "Built with Astro Orbit. Maintained with curiosity.",
    zh: "由热爱驱动，基于 Astro Orbit 构建",
  },

  /** Quick-copy card shown on `/friends/` for visitors adding your site. */
  friendCard: {
    name: "Astro Orbit",
    desc: "Bilingual editorial blog & knowledge base built with Astro 7",
    avatar: "/brand/orbit-logo-192.png",
  },

  /** Quick suggestion chips inside the Cmd/Ctrl+K search modal. */
  searchSuggestions: {
    en: ["Astro", "Markdown", "Design"],
    zh: ["Astro", "Markdown", "排版"],
  },

  /** Optional webmaster verification meta tags (leave empty to omit). */
  siteVerification: {
    google: "",
    baidu: "",
  },
} as const;
