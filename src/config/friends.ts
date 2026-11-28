export interface FriendLink {
  name: string;
  url: string;
  description: string;
  avatar?: string;
  tags?: string[];
}

export interface FriendGroup {
  id: string;
  index: string;
  eyebrow: string;
  title: {
    en: string;
    zh: string;
  };
  description: {
    en: string;
    zh: string;
  };
  cardKind: string;
  isOrg?: boolean;
  items: FriendLink[];
}

/**
 * Curated link directory rendered on `/friends/`.
 * Add, remove, or reorder groups freely — the page index and sections adapt automatically.
 */
export const FRIEND_GROUPS: FriendGroup[] = [
  {
    id: "blogs",
    index: "01",
    eyebrow: "01 / PERSONAL SITES",
    title: {
      en: "Blogs & Makers",
      zh: "独立博客",
    },
    description: {
      en: "Independent voices, engineering journals, and thoughtful corners of the web.",
      zh: "持续输出思考、工程笔记与独立观点的个人站点。",
    },
    cardKind: "PERSONAL BLOG",
    items: [
      {
        name: "Astro Docs",
        url: "https://docs.astro.build/",
        description: "The web framework for content-driven websites.",
        tags: ["Astro", "Docs"],
      },
      {
        name: "Starlight",
        url: "https://starlight.astro.build/",
        description: "Build accessible, fast documentation websites with Astro.",
        tags: ["Docs", "Template"],
      },
      {
        name: "Overreacted",
        url: "https://overreacted.io/",
        description: "Personal engineering essays on React, compilers, and software craft.",
        tags: ["Engineering", "Essays"],
      },
    ],
  },
  {
    id: "ecosystem",
    index: "02",
    eyebrow: "02 / ECOSYSTEM",
    title: {
      en: "Tools & Communities",
      zh: "生态与工具",
    },
    description: {
      en: "Open-source projects and standards powering this template.",
      zh: "支撑本模板构建、排版与搜索体验的开源项目。",
    },
    cardKind: "OPEN SOURCE",
    isOrg: true,
    items: [
      {
        name: "Tailwind CSS",
        url: "https://tailwindcss.com/",
        description: "A utility-first CSS framework for rapid UI craftsmanship.",
        tags: ["CSS", "Design System"],
      },
      {
        name: "Pagefind",
        url: "https://pagefind.app/",
        description: "Static low-bandwidth search library built in Rust for static sites.",
        tags: ["Search", "WASM"],
      },
      {
        name: "MDX",
        url: "https://mdxjs.com/",
        description: "Markdown for the component era — write JSX seamlessly inside prose.",
        tags: ["Markdown", "Components"],
      },
    ],
  },
];
