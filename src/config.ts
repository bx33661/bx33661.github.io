/**
 * Downstream Site Configuration (`bx33661.github.io`) aligned with `astro-orbit`.
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

const SITE_ORIGIN = "https://www.bx33661.com";
const SITE_BASE = "/";
const SITE_PROFILE = "https://github.com/bx33661";
const SITE_EMAIL = "bx33661@gmail.com";
const DEFAULT_LOCALE: SiteLocale = "zh-CN";
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
  "我是BX，欢迎来到我的博客！这里分享网络安全、CTF、Web安全等技术研究，和我一起学习、成长、分享，见证星辰大海！";
const SITE_DESCRIPTION_EN =
  "Hey, I'm bx. Cybersecurity, LLMs, CTF research, and reproducible engineering notes.";

const APPROVED_HOME_COPY: HomeLocaleCopy = {
  pageTitle: "bx · Cybersecurity, LLMs & Personal Notes",
  eyebrow: "A LITTLE CORNER OF THE INTERNET",
  greetingPrefix: "Hey, I'm ",
  greetingHighlight: "bx.",
  welcome: "Welcome to my blog!",
  horizonTag: "CURIOSITY, IN ORBIT",
  focusLeadPrefix: "I'm currently focused on ",
  focusLeadStrong: "the field of Computer Science",
  focusLeadSuffix: ", while staying curious about interesting technologies and the unknown.",
  introParagraphs: [
    "This is my little corner of the internet where I document what I learn, explore, and think about. Most of the content revolves around technology, including study notes, hands-on experiences, and scattered thoughts. Occasionally, I'll also share things beyond the world of tech.",
    "I don't expect every post to have all the answers. More often than not, what I write simply reflects my understanding at a particular point in time. As I continue to explore and learn, my perspectives may shift, my understanding will evolve, and I'll revisit, refine, and update what I've written along the way.",
    "I hope this blog becomes a space where ideas and experiences gradually accumulate, leaving traces of my explorations and capturing my growth along the journey.",
    "Feel free to look around! If something here helps you, sparks a thought, or gives you a different perspective, I'd love to hear from you.",
  ],
  closing: "Let's explore the stars and beyond together.",
  closingEmoji: "🌟",
  monographLang: "en",
  focusHeading: "Focus",
  readBlogLabel: "Read the blog",
  readNotesLabel: "Notes",
  observatoryTitle: "ORBIT // DEEP FIELD",
  observatoryStatus: "IN ORBIT",
  observatoryCaptionLeft: "CYBERSECURITY · LLMS",
  observatoryCaptionRight: "AD ASTRA · 01",
  focusTopics: ["AI", "Security", "Web", "CTF"],
};

export const SITE = {
  website: `${SITE_ORIGIN}/`,
  href: SITE_ORIGIN,
  base: SITE_BASE,
  title: "BX",
  author: "BX",
  defaultAuthorId: "bx",
  authorAliases: ["bx", "bx33661", "BX"] as readonly string[],
  profile: SITE_PROFILE,
  email: SITE_EMAIL,
  location: "China",
  timezone: "Asia/Shanghai",
  templateName: "astro-orbit",

  desc: SITE_DESCRIPTION,
  descZh: SITE_DESCRIPTION,
  descEn: SITE_DESCRIPTION_EN,
  description: SITE_DESCRIPTION,

  ogImage: "brand/bx-logo-512.png",
  brandLogo: "/brand/bx-logo.svg",
  faviconSvg: "/brand/bx-logo.svg",
  faviconPng: "/brand/bx-logo-32.png",
  appleTouchIcon: "/brand/apple-touch-icon.png",
  faviconIco: "/brand/favicon.ico",
  ogKicker: "CYBERSECURITY / LLMS / NOTES",

  i18n: {
    defaultLocale: DEFAULT_LOCALE as SiteLocale,
    bilingual: BILINGUAL as boolean,
  },
  dir: "ltr" as const,
  lang: DEFAULT_LOCALE,
  locale: DEFAULT_LOCALE,

  theme: {
    preset: THEME_PRESET as ThemePreset,
    defaultMode: THEME_DEFAULT_MODE as ThemeDefaultMode,
    accentLight: "" as string,
    accentDark: "" as string,
  },

  socials: [
    { name: "GitHub", href: SITE_PROFILE, icon: "github" as SocialIconName },
    { name: "Mail", href: `mailto:${SITE_EMAIL}`, icon: "mail" as SocialIconName },
  ] as readonly SocialLinkConfig[],

  shareLinks: ["x", "telegram", "whatsapp", "facebook", "mail"] as readonly ShareChannel[],

  features: FEATURES,
  lightAndDarkMode: FEATURES.lightAndDarkMode,
  showArchives: FEATURES.archives,
  showGalleries: FEATURES.galleries,
  showBackButton: FEATURES.showBackButton,
  dynamicOgImage: FEATURES.dynamicOgImage,

  postPerIndex: 6,
  postPerPage: 8,
  topicMinPosts: 2,
  tagIndexMinPosts: Number.POSITIVE_INFINITY,
  scheduledPostMargin: 15 * 60 * 1000,

  editPost: {
    enabled: true,
    text: {
      en: "Edit this page",
      zh: "编辑这篇文章",
    },
    url: "https://github.com/bx33661/bx33661.github.io/edit/main/",
  },

  home: {
    en: APPROVED_HOME_COPY,
    zh: APPROVED_HOME_COPY,
  } as { en: HomeLocaleCopy; zh: HomeLocaleCopy },

  projectsPage: {
    en: {
      title: "Projects",
      description: "Open-source tools, security utilities, and experiments maintained with care.",
      leadEn: "Security & software. Builder of small, sharp tools.",
      leadSub: "Open-source security research utilities, MCP tools, and reproducible engineering workflows.",
    },
    zh: {
      title: "项目",
      description: "长期维护的开源项目、安全工具与日常工程实验。",
      leadEn: "Security & software. Builder of small, sharp tools.",
      leadSub: "围绕网络安全、AI Agent 与工程效率，做一些自己每天都在用的小项目。",
    },
  },

  friendsPage: {
    en: {
      title: "Friends",
      description: "Independent blogs, security teams, and builders worth bookmarking.",
      eyebrow: "FRIENDS / DIRECTORY",
      headingLine1: "Friends,",
      headingEmphasis: "in orbit",
      subtitle: "朋友们 · 同行者 · 值得反复访问的站点",
      lead: "Good people. Interesting corners of the web.",
      exchangeTitle: "One more good corner?",
      exchangeDesc: "If you write about security, engineering, or anything you care deeply about, feel free to exchange links.",
      exchangeHint: "Include your site name, URL, one-line bio, and avatar link.",
    },
    zh: {
      title: "友情链接",
      description: "独立博客、安全团队与值得收藏的站点集合。",
      eyebrow: "FRIENDS / DIRECTORY",
      headingLine1: "Friends,",
      headingEmphasis: "in orbit",
      subtitle: "朋友们 · 同行者 · 值得反复访问的站点",
      lead: "Good people. Interesting corners of the web.",
      exchangeTitle: "欢迎交换友链",
      exchangeDesc: "如果你也在认真写博客、记录技术或安全研究，欢迎来信交流并把你的站点放进轨道。",
      exchangeHint: "来信请附站点名称、URL、一句话简介与头像链接。",
    },
  },

  footerTagline: {
    en: "Notes on cybersecurity and engineering, grounded in reproducible work.",
    zh: "记录网络安全与工程实践，持续分享真实可复现的技术经验。",
  },
  footerColophon: {
    en: "Built with curiosity. Maintained over time.",
    zh: "由热爱驱动，长期维护更新",
  },

  friendCard: {
    name: "BX的博客",
    desc: "专注于安全研究和技术分享的个人博客",
    avatar: "/brand/bx-logo-192.png",
  },

  searchSuggestions: {
    en: ["CodeQL", "CTF", "CyberGym"],
    zh: ["CodeQL", "CTF", "小程序"],
  },

  siteVerification: {
    google: "",
    baidu: "",
  },
} as const;
