import type { ArticleSeries } from "@/utils/article-discovery";

// Add a series here with existing, stable article slugs in explicit reading order.
// Hidden/unpublished entries are omitted by the discovery helper, not linked publicly.
export const articleSeries: readonly ArticleSeries[] = [
  {
    title: "Redis 学习与实践",
    slugs: ["redis-core-guide", "redis-lua-script-part2"],
  },
  {
    title: "AI Agent 安全与自动化审计",
    slugs: [
      "claude-code",
      "agent-teams",
      "oh-my-vul-1-0",
      "wechat-miniapp-security-audit",
      "threat-modeling-and-trust-boundaries",
      "cybergym-ai-security-agent-benchmark",
    ],
  },
  {
    title: "MCP 与 LLM 安全研究",
    slugs: ["mcp1", "mcp-security", "llm-attack-hackergame"],
  },
  {
    title: "春秋云境与内网渗透实战",
    slugs: ["chunqiu-Initial", "brute4road", "tsclient"],
  },
  {
    title: "Web 与网络协议安全",
    slugs: ["bxtcp", "bx33661http", "bxhttpSplit", "websocket-handshake-message-replay"],
  },
  {
    title: "Webshell 流量分析与溯源",
    slugs: ["k8x9w22", "k8x9w23"],
  },
  {
    title: "Redis Study & Practice",
    slugs: ["redis-core-guide-en", "redis-lua-script-part2-en"],
  },
  {
    title: "AI Agent Security & Automated Auditing",
    slugs: [
      "claude-code-en",
      "agent-teams-en",
      "oh-my-vul-1-0-en",
      "wechat-miniapp-security-audit-en",
      "threat-modeling-and-trust-boundaries-en",
      "cybergym-ai-security-agent-benchmark-en",
    ],
  },
  {
    title: "MCP & LLM Security Research",
    slugs: ["mcp1-en", "mcp-security-en", "llm-attack-hackergame-en"],
  },
  {
    title: "Chunqiu Cloud & Internal Network Labs",
    slugs: ["chunqiu-initial-en", "brute4road-en", "tsclient-en"],
  },
  {
    title: "Web & Network Protocol Security",
    slugs: ["bxtcp-en", "bx33661http-en", "bxhttpsplit-en", "websocket-handshake-message-replay-en"],
  },
  {
    title: "Webshell Traffic Analysis & Forensics",
    slugs: ["k8x9w22-en", "k8x9w23-en"],
  },
];
