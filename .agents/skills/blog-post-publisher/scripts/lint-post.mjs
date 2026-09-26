#!/usr/bin/env node
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

/**
 * Astro Blog Article Linter & Normalizer
 * Usage: node .agents/skills/blog-post-publisher/scripts/lint-post.mjs [file-path] [--fix]
 */

const CANONICAL_TAGS = {
  ctf: "CTF",
  web: "Web",
  python: "Python",
  ai: "AI",
  javascript: "JavaScript",
  java: "Java",
  nginx: "Nginx",
  llm: "LLM",
  security: "Security",
  ssti: "SSTI",
  rce: "RCE",
  idor: "IDOR",
  codeql: "CodeQL",
  xss: "XSS",
  xxe: "XXE",
  csrf: "CSRF",
};

const args = process.argv.slice(2);
const shouldFix = args.includes("--fix");
const targetFile = args.find((a) => !a.startsWith("--"));

if (!targetFile) {
  console.error("用法: node lint-post.mjs <src/content/blog/xxx.md> [--fix]");
  process.exit(1);
}

const fullPath = path.resolve(targetFile);
if (!fs.existsSync(fullPath)) {
  console.error(`错误: 文件未找到: ${targetFile}`);
  process.exit(1);
}

let raw = fs.readFileSync(fullPath, "utf-8");
let issues = [];
let modified = false;

// 1. 检查文件开头是否为 ---
if (!raw.startsWith("---")) {
  issues.push("文件开头存在空白字符，Frontmatter 必须从第 1 行严格起始");
  if (shouldFix) {
    raw = raw.replace(/^\s+---/, "---");
    modified = true;
  }
}

const parts = raw.split("---");
if (parts.length < 3) {
  console.error("致命错误: Frontmatter 未正确闭合（缺少成对的 ---）");
  process.exit(1);
}

const fmRaw = parts[1];
let body = parts.slice(2).join("---");

let fm = {};
try {
  fm = yaml.load(fmRaw) || {};
} catch (e) {
  console.error(`YAML 解析失败: ${e.message}`);
  process.exit(1);
}

// 2. 与 content-check 的阻断字段保持一致；其他字段是新文章建议值。
const required = ["title", "description", "date"];
for (const req of required) {
  if (fm[req] === undefined || fm[req] === null || fm[req] === "") {
    issues.push(`Frontmatter 缺失必要字段: ${req}`);
  }
}

// 3. 检查并修正 slug 格式
if (fm.slug) {
  if (typeof fm.slug !== "string" || !/^[a-z0-9-]+$/.test(fm.slug)) {
    issues.push(`slug 命名不规范 [${fm.slug}]，必须为英文小写短横线格式 (kebab-case)`);
  }
}

// 4. 检查并修正 tags 归一化
if (Array.isArray(fm.tags)) {
  let tagsChanged = false;
  const newTags = fm.tags.map((t) => {
    const key = String(t).toLowerCase();
    if (CANONICAL_TAGS[key] && CANONICAL_TAGS[key] !== t) {
      issues.push(`标签大小写待归一化: "${t}" -> "${CANONICAL_TAGS[key]}"`);
      tagsChanged = true;
      return CANONICAL_TAGS[key];
    }
    return t;
  });

  if (tagsChanged && shouldFix) {
    fm.tags = newTags;
    modified = true;
  }
}

// 5. 检查本地图片路径与命名规范
const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
let match;
while ((match = imgRegex.exec(body)) !== null) {
  const alt = match[1];
  const url = match[2].trim();

  // 空图片链接
  if (!url) {
    issues.push(`检测到空的图片链接: ![]()`);
  }

  // Windows 本地绝对路径
  if (/^[A-Za-z]:\\/.test(url) || url.includes("AppData\\Roaming")) {
    issues.push(`包含本地临时绝对路径图片: ${url}`);
  }

  // 检查是否包含空格
  if (url.includes(" ") || url.includes("%20")) {
    issues.push(`图片 URL 中包含空格: ${url}，必须重命名为无空格连字符格式`);
  }

  // 本地图片存在性校验
  if (url.startsWith("/blog/")) {
    const cleanPath = decodeURIComponent(url.split("?")[0].split("#")[0]);
    const localFsPath = path.join("public", cleanPath.replace(/^\//, ""));
    if (!fs.existsSync(localFsPath)) {
      issues.push(`引用了不存在的本地静态图片: ${url} (预期位于: ${localFsPath})`);
    }
  }
}

// 6. 检查空标题与标题缺失空格
const bodyLines = body.split("\n");
let inCode = false;
bodyLines.forEach((line, idx) => {
  if (line.trim().startsWith("```")) {
    inCode = !inCode;
    return;
  }
  if (!inCode) {
    const headingMatch = line.match(/^(#{1,6})(.*)$/);
    if (headingMatch) {
      const hashes = headingMatch[1];
      const text = headingMatch[2];
      if (!text.trim()) {
        issues.push(`第 ${idx + 1} 行存在空白无效标题: "${line}"`);
      } else if (!text.startsWith(" ")) {
        issues.push(`第 ${idx + 1} 行标题 # 后缺少空格: "${line}"`);
      }
    }
  }
});

// 7. 语雀 OCR 与残留标签检查
if (/<!--\s*这是一张图片.*?-->/s.test(body)) {
  issues.push("正文中包含语雀导入残留的 OCR 注释: <!-- 这是一张图片... -->");
  if (shouldFix) {
    body = body.replace(/<!--\s*这是一张图片.*?-->\n?/gs, "");
    modified = true;
  }
}

if (/<font\s+style=/i.test(body) || /<\/font>/i.test(body)) {
  issues.push("正文中包含冗余的 <font> 样式标签");
}

// 8. 连续过多空行清理
const cleanedBody = body.replace(/\n{3,}/g, "\n\n");
if (cleanedBody !== body) {
  issues.push("正文中存在 3 行以上的不规则连续空行");
  if (shouldFix) {
    body = cleanedBody;
    modified = true;
  }
}

// 打印报告
console.log(`\n================= 文章合规规范检查报告 =================`);
console.log(`目标文件: ${targetFile}`);
console.log(`检测问题数: ${issues.length}`);

if (issues.length === 0) {
  console.log("✅ 完美！文章完全符合规范要求。");
} else {
  issues.forEach((iss, i) => console.log(`  ${i + 1}. ${iss}`));
  if (shouldFix && modified) {
    // 重新写回
    const newFmText = yaml.dump(fm, { indent: 2, lineWidth: -1 }).trim();
    const finalContent = `---\n${newFmText}\n---\n${body}`;
    fs.writeFileSync(fullPath, finalContent, "utf-8");
    console.log(`\n✨ 已自动应用并修复了可自动解决的规范问题！`);
  } else if (!shouldFix) {
    console.log(`\n💡 提示: 可添加 --fix 参数尝试自动修复常规格式问题: node lint-post.mjs ${targetFile} --fix`);
  }
}
console.log(`=======================================================\n`);
