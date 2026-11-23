/**
 * Projects page data (/projects/).
 *
 * Logos live in public/images/projects/ (copied from each repository's own brand assets).
 */

export interface Project {
  /** Repository name, shown as the card title. */
  name: string;
  /** Logo path under public/. */
  logo: string;
  /** Small uppercase category line (jdx-style). */
  kind: string;
  /** One-line summary. */
  summary: string;
  /** Longer Chinese description. */
  description: string;
  repo: string;
  homepage?: string;
  language: string;
  languageColor: string;
  license?: string;
  updated: string;
  /** Terminal line shown in the card footer. */
  command: string;
  topics: string[];
}

export const PROJECTS: Project[] = [
  {
    name: "Wireshark-MCP",
    logo: "/images/projects/wireshark-mcp.png",
    kind: "Python · MCP Server",
    summary: "Give your AI assistant a packet analyzer.",
    description: "把 .pcap 交给 AI 助手，用自然语言提问，答案都来自真实的 tshark 解析数据。",
    repo: "https://github.com/bx33661/Wireshark-MCP",
    language: "Python",
    languageColor: "#3572A5",
    license: "MIT",
    updated: "2026-11-01",
    command: "pip install wireshark-mcp",
    topics: ["mcp", "tshark", "pcap", "network-security"],
  },
  {
    name: "pinwhy",
    logo: "/images/projects/pinwhy.svg",
    kind: "Node.js CLI · Local-first",
    summary: "Persistent context and replayable thinking for AI coding agents.",
    description: "Agent 的外置记忆与可视化工作台：持久上下文、证据链接与可回放的思考过程。",
    repo: "https://github.com/bx33661/pinwhy",
    homepage: "https://pinwhy.bx33661.com/",
    language: "JavaScript",
    languageColor: "#F1E05A",
    license: "MIT",
    updated: "2026-11-21",
    command: "npm install --global pinwhy",
    topics: ["agent-memory", "context-engineering", "event-sourcing", "react-flow"],
  },
  {
    name: "WxLocated",
    logo: "/images/projects/wxlocated.svg",
    kind: "Rust · GPUI Desktop",
    summary: "Locate, unpack and rebuild WeChat mini-program sources.",
    description:
      "微信小程序缓存定位、解包解密与源码重建工具，提供 macOS 桌面工作区、JSON CLI 与可追溯的 Agent 审计材料。",
    repo: "https://github.com/bx33661/WxLocated",
    language: "Rust",
    languageColor: "#DEA584",
    updated: "2026-11-21",
    command: "cargo build --release -p wxlocated-cli",
    topics: ["reverse-engineering", "wxapkg", "static-analysis", "macos"],
  },
  {
    name: "bx33661.github.io",
    logo: "/brand/bx-logo-192.png",
    kind: "Astro · Static Site",
    summary: "This blog — security research, CTF and engineering notes.",
    description: "BX 的个人技术博客：网络安全、CTF、Web 安全与工程实践，Astro + Pagefind 构建。",
    repo: "https://github.com/bx33661/bx33661.github.io",
    homepage: "https://www.bx33661.com",
    language: "Astro",
    languageColor: "#FF5A03",
    updated: "2026-11-21",
    command: "npm ci && npm run dev",
    topics: ["astro", "tailwindcss", "pagefind", "web-security"],
  },
];
