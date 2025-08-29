/**
 * Rehype插件：自动检测代码块语言
 * 处理没有指定语言的代码块，自动识别并添加语言标识
 */
import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';
import { detectLanguage } from './language-detector';

export interface AutoLanguageOptions {
  /** 是否启用自动检测 */
  enabled?: boolean;
  /** 默认语言（当检测失败时使用） */
  fallbackLanguage?: string;
  /** 是否添加自动检测标记 */
  addDetectionMark?: boolean;
  /** 最小代码长度（小于此长度不进行检测） */
  minCodeLength?: number;
  /** 排除的语言列表 */
  excludeLanguages?: string[];
}

const defaultOptions: Required<AutoLanguageOptions> = {
  enabled: true,
  fallbackLanguage: 'text',
  addDetectionMark: true,
  minCodeLength: 10,
  excludeLanguages: ['text', 'plain', 'txt']
};

/**
 * 检查元素是否为代码块
 */
function isCodeBlock(node: Element): boolean {
  return (
    node.tagName === 'pre' &&
    node.children.length === 1 &&
    node.children[0].type === 'element' &&
    (node.children[0] as Element).tagName === 'code'
  );
}

/**
 * 从类名中提取语言
 */
function extractLanguageFromClass(className: string): string | null {
  const match = className.match(/language-([\w-]+)/);
  return match ? match[1] : null;
}

/**
 * 获取代码内容
 */
function getCodeContent(codeElement: Element): string {
  let content = '';
  
  function extractText(node: any): void {
    if (node.type === 'text') {
      content += node.value;
    } else if (node.children) {
      node.children.forEach(extractText);
    }
  }
  
  extractText(codeElement);
  return content.trim();
}

/**
 * 添加或更新类名
 */
function updateClassName(element: Element, newLanguage: string, isAutoDetected: boolean = false): void {
  const properties = element.properties || {};
  const className = properties.className as string[] || [];
  
  // 移除现有的language-*类
  const filteredClasses = className.filter(cls => !cls.startsWith('language-'));
  
  // 添加新的语言类
  filteredClasses.push(`language-${newLanguage}`);
  
  // 如果是自动检测的，添加标记类
  if (isAutoDetected) {
    filteredClasses.push('auto-detected');
  }
  
  element.properties = {
    ...properties,
    className: filteredClasses
  };
}

/**
 * 添加数据属性
 */
function addDataAttributes(element: Element, language: string, isAutoDetected: boolean): void {
  const properties = element.properties || {};
  
  element.properties = {
    ...properties,
    'data-language': language,
    ...(isAutoDetected && { 'data-auto-detected': 'true' })
  };
}

/**
 * 主要的插件函数
 */
export function rehypeAutoLanguage(options: AutoLanguageOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  
  return function transformer(tree: Root) {
    if (!opts.enabled) return;
    
    visit(tree, 'element', (node: Element) => {
      // 只处理代码块
      if (!isCodeBlock(node)) return;
      
      const codeElement = node.children[0] as Element;
      const properties = codeElement.properties || {};
      const className = properties.className as string[] || [];
      
      // 检查是否已有语言类
      let currentLanguage: string | null = null;
      for (const cls of className) {
        const lang = extractLanguageFromClass(cls);
        if (lang) {
          currentLanguage = lang;
          break;
        }
      }
      
      // 如果已有语言且不在排除列表中，跳过
      if (currentLanguage && !opts.excludeLanguages.includes(currentLanguage)) {
        return;
      }
      
      // 获取代码内容
      const codeContent = getCodeContent(codeElement);
      
      // 检查代码长度
      if (codeContent.length < opts.minCodeLength) {
        return;
      }
      
      // 自动检测语言
      const detectedLanguage = detectLanguage(codeContent);
      
      // 如果检测失败，使用fallback语言
      const finalLanguage = detectedLanguage || opts.fallbackLanguage;
      
      // 更新代码元素的类名和属性
      updateClassName(codeElement, finalLanguage, !!detectedLanguage);
      addDataAttributes(codeElement, finalLanguage, !!detectedLanguage);
      
      // 同时更新pre元素
      updateClassName(node, finalLanguage, !!detectedLanguage);
      addDataAttributes(node, finalLanguage, !!detectedLanguage);
      
      // 如果启用检测标记且是自动检测的，添加提示元素
      if (opts.addDetectionMark && detectedLanguage) {
        const markElement: Element = {
          type: 'element',
          tagName: 'span',
          properties: {
            className: ['auto-detect-mark'],
            title: `自动检测为: ${detectedLanguage}`
          },
          children: [
            {
              type: 'text',
              value: '🔍'
            }
          ]
        };
        
        // 将标记添加到pre元素的开头
        node.children.unshift(markElement);
      }
    });
  };
}

/**
 * 用于MDX的组件包装器
 */
export function createAutoCodeBlock() {
  return function AutoCodeBlockWrapper({ children, className, ...props }: any) {
    // 从className中提取语言
    const language = className ? extractLanguageFromClass(className) : null;
    
    // 如果没有语言或是排除的语言，进行自动检测
    if (!language || defaultOptions.excludeLanguages.includes(language)) {
      const codeContent = typeof children === 'string' ? children : '';
      const detectedLanguage = detectLanguage(codeContent);
      
      if (detectedLanguage) {
        const newClassName = className 
          ? className.replace(/language-[\w-]+/, `language-${detectedLanguage}`)
          : `language-${detectedLanguage}`;
        
        return {
          ...props,
          className: `${newClassName} auto-detected`,
          'data-language': detectedLanguage,
          'data-auto-detected': 'true',
          children
        };
      }
    }
    
    return { ...props, className, children };
  };
}

export default rehypeAutoLanguage;