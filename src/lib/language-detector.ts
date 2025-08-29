/**
 * 自动语言检测工具
 * 通过分析代码内容的特征来识别编程语言
 */

import { LANGUAGE_RULES, type LanguageRule } from '../config/language-detection';

/**
 * 检测代码语言
 * @param code 代码内容
 * @param filename 文件名（可选）
 * @returns 检测到的语言标识符，如果无法检测则返回null
 */
export function detectLanguage(code: string, filename?: string): string | null {
  if (!code || code.trim().length === 0) {
    return null;
  }

  // 清理代码以便分析
  const cleanCode = cleanCodeForAnalysis(code);
  
  // 如果提供了文件名，首先尝试从扩展名推断
  if (filename) {
    const extensionMatch = getLanguageByExtension(filename);
    if (extensionMatch) {
      // 验证扩展名匹配是否与代码内容一致
      const rule = LANGUAGE_RULES.find(r => r.id === extensionMatch);
      if (rule && analyzeCodeContent(cleanCode, rule) > 0.3) {
        return extensionMatch;
      }
    }
  }

  // 分析所有语言规则
  const scores: Array<{ language: string; score: number }> = [];

  for (const rule of LANGUAGE_RULES) {
    const score = analyzeCodeContent(cleanCode, rule);
    if (score > 0) {
      scores.push({ language: rule.id, score: score * rule.weight });
    }
  }

  // 按分数排序
  scores.sort((a, b) => b.score - a.score);

  // 返回得分最高的语言（如果分数足够高）
  if (scores.length > 0 && scores[0].score > 0.2) {
    return scores[0].language;
  }

  return null;
}

/**
 * 分析代码内容与语言规则的匹配度
 * @param code 清理后的代码
 * @param rule 语言规则
 * @returns 匹配分数（0-1之间）
 */
function analyzeCodeContent(code: string, rule: LanguageRule): number {
  let score = 0;
  let totalChecks = 0;

  // 检查关键词
  if (rule.keywords.length > 0) {
    let keywordMatches = 0;
    for (const keyword of rule.keywords) {
      const regex = rule.caseSensitive 
        ? new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'g')
        : new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'gi');
      
      if (regex.test(code)) {
        keywordMatches++;
      }
    }
    score += (keywordMatches / rule.keywords.length) * 0.4;
    totalChecks += 0.4;
  }

  // 检查正则表达式模式
  if (rule.patterns.length > 0) {
    let patternMatches = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(code)) {
        patternMatches++;
      }
    }
    score += (patternMatches / rule.patterns.length) * 0.6;
    totalChecks += 0.6;
  }

  // 归一化分数
  return totalChecks > 0 ? score / totalChecks : 0;
}

/**
 * 清理代码以便分析
 * @param code 原始代码
 * @returns 清理后的代码
 */
function cleanCodeForAnalysis(code: string): string {
  return code
    // 移除多行注释
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 移除单行注释（但保留shebang）
    .replace(/^(?!#!).*\/\/.*$/gm, '')
    // 移除HTML注释
    .replace(/<!--[\s\S]*?-->/g, '')
    // 移除字符串字面量（简单处理）
    .replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '""')
    // 标准化空白字符
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 获取所有支持的语言列表
 */
export function getSupportedLanguages(): string[] {
  return LANGUAGE_RULES.map(rule => rule.id);
}

/**
 * 检查语言是否被支持
 */
export function isSupportedLanguage(language: string): boolean {
  return LANGUAGE_RULES.some(rule => rule.id === language);
}

/**
 * 根据文件扩展名获取语言
 */
export function getLanguageByExtension(filename: string): string | null {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  for (const rule of LANGUAGE_RULES) {
    if (rule.extensions.some(ext => ext.toLowerCase() === extension)) {
      return rule.id;
    }
  }
  
  return null;
}

/**
 * 获取语言的显示名称
 */
export function getLanguageDisplayName(languageId: string): string {
  const rule = LANGUAGE_RULES.find(r => r.id === languageId);
  return rule ? rule.name : languageId;
}

/**
 * 批量检测多个代码片段的语言
 */
export function detectLanguages(codeSnippets: Array<{ code: string; filename?: string }>): Array<{ language: string | null; confidence: number }> {
  return codeSnippets.map(snippet => {
    const language = detectLanguage(snippet.code, snippet.filename);
    
    // 计算置信度
    let confidence = 0;
    if (language) {
      const rule = LANGUAGE_RULES.find(r => r.id === language);
      if (rule) {
        const cleanCode = cleanCodeForAnalysis(snippet.code);
        confidence = analyzeCodeContent(cleanCode, rule);
      }
    }
    
    return { language, confidence };
  });
}