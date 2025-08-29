/**
 * 语言检测配置文件
 * 定义各种编程语言的识别规则和特征
 */

export interface LanguageRule {
  /** 语言名称 */
  name: string;
  /** 语言标识符 */
  id: string;
  /** 文件扩展名 */
  extensions: string[];
  /** 关键词 */
  keywords: string[];
  /** 正则表达式模式 */
  patterns: RegExp[];
  /** 权重（用于多个语言匹配时的优先级） */
  weight: number;
  /** 是否区分大小写 */
  caseSensitive: boolean;
}

/**
 * 语言检测规则配置
 */
export const LANGUAGE_RULES: LanguageRule[] = [
  {
    name: 'JavaScript',
    id: 'javascript',
    extensions: ['.js', '.mjs', '.cjs'],
    keywords: [
      'function', 'var', 'let', 'const', 'class', 'extends', 'import', 'export',
      'require', 'module.exports', 'async', 'await', 'Promise', 'console.log',
      'document', 'window', 'localStorage', 'sessionStorage', 'JSON.parse',
      'JSON.stringify', 'setTimeout', 'setInterval', 'addEventListener'
    ],
    patterns: [
      /\bfunction\s+\w+\s*\(/,
      /\b(var|let|const)\s+\w+\s*=/,
      /\bclass\s+\w+/,
      /\b(import|export)\s+/,
      /\brequire\s*\(/,
      /\bconsole\.(log|error|warn|info)\s*\(/,
      /\bdocument\.(getElementById|querySelector)/,
      /\b(async|await)\b/,
      /\b\w+\.prototype\./,
      /\b(setTimeout|setInterval)\s*\(/
    ],
    weight: 10,
    caseSensitive: true
  },
  {
    name: 'TypeScript',
    id: 'typescript',
    extensions: ['.ts', '.tsx'],
    keywords: [
      'interface', 'type', 'enum', 'namespace', 'declare', 'readonly',
      'public', 'private', 'protected', 'abstract', 'implements',
      'generic', 'extends', 'keyof', 'typeof', 'as', 'satisfies'
    ],
    patterns: [
      /\binterface\s+\w+/,
      /\btype\s+\w+\s*=/,
      /\benum\s+\w+/,
      /\b(public|private|protected)\s+/,
      /:\s*\w+\s*[=;]/,
      /\b\w+\s*:\s*\w+/,
      /\b(readonly|abstract)\s+/,
      /\bimplements\s+\w+/,
      /\b\w+<[^>]+>/,
      /\bas\s+\w+/
    ],
    weight: 12,
    caseSensitive: true
  },
  {
    name: 'Python',
    id: 'python',
    extensions: ['.py', '.pyw', '.pyi'],
    keywords: [
      'def', 'class', 'import', 'from', 'if', 'elif', 'else', 'for', 'while',
      'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'return',
      'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'sorted'
    ],
    patterns: [
      /\bdef\s+\w+\s*\(/,
      /\bclass\s+\w+/,
      /\bfrom\s+\w+\s+import/,
      /\bimport\s+\w+/,
      /\bif\s+__name__\s*==\s*['"]__main__['"]/,
      /\bprint\s*\(/,
      /\bfor\s+\w+\s+in\s+/,
      /\bwith\s+\w+\s+as\s+/,
      /\btry:\s*$/m,
      /\bexcept\s+\w*:/
    ],
    weight: 11,
    caseSensitive: true
  },
  {
    name: 'Java',
    id: 'java',
    extensions: ['.java'],
    keywords: [
      'public', 'private', 'protected', 'static', 'final', 'abstract',
      'class', 'interface', 'extends', 'implements', 'package', 'import',
      'void', 'int', 'String', 'boolean', 'double', 'float', 'long',
      'System.out.println', 'new', 'this', 'super', 'instanceof'
    ],
    patterns: [
      /\bpublic\s+class\s+\w+/,
      /\bpublic\s+static\s+void\s+main/,
      /\bSystem\.out\.print/,
      /\bpackage\s+[\w.]+;/,
      /\bimport\s+[\w.]+;/,
      /\b(public|private|protected)\s+(static\s+)?(final\s+)?\w+\s+\w+/,
      /\bnew\s+\w+\s*\(/,
      /\binstanceof\s+\w+/,
      /\b@\w+/,
      /\bthrows\s+\w+/
    ],
    weight: 10,
    caseSensitive: true
  },
  {
    name: 'C++',
    id: 'cpp',
    extensions: ['.cpp', '.cc', '.cxx', '.c++', '.hpp', '.hh', '.hxx'],
    keywords: [
      '#include', 'using', 'namespace', 'std', 'class', 'struct', 'template',
      'public', 'private', 'protected', 'virtual', 'override', 'const',
      'static', 'extern', 'inline', 'cout', 'cin', 'endl', 'vector', 'string'
    ],
    patterns: [
      /#include\s*[<"]/,
      /\busing\s+namespace\s+std/,
      /\bstd::/,
      /\bcout\s*<<|cin\s*>>/,
      /\btemplate\s*</,
      /\bclass\s+\w+/,
      /\bstruct\s+\w+/,
      /\bvirtual\s+/,
      /\boverride\b/,
      /\bconst\s+\w+\s*&/
    ],
    weight: 9,
    caseSensitive: true
  },
  {
    name: 'C',
    id: 'c',
    extensions: ['.c', '.h'],
    keywords: [
      '#include', '#define', '#ifdef', '#ifndef', '#endif', 'int', 'char',
      'float', 'double', 'void', 'struct', 'typedef', 'enum', 'union',
      'static', 'extern', 'const', 'volatile', 'printf', 'scanf', 'malloc', 'free'
    ],
    patterns: [
      /#include\s*[<"]/,
      /#define\s+\w+/,
      /\bprintf\s*\(/,
      /\bscanf\s*\(/,
      /\bmalloc\s*\(/,
      /\bfree\s*\(/,
      /\bstruct\s+\w+/,
      /\btypedef\s+/,
      /\bint\s+main\s*\(/,
      /\breturn\s+0;/
    ],
    weight: 8,
    caseSensitive: true
  },
  {
    name: 'PHP',
    id: 'php',
    extensions: ['.php', '.phtml', '.php3', '.php4', '.php5'],
    keywords: [
      '<?php', 'echo', 'print', 'var_dump', 'function', 'class', 'extends',
      'implements', 'interface', 'namespace', 'use', 'require', 'include',
      '$_GET', '$_POST', '$_SESSION', '$_COOKIE', 'isset', 'empty', 'array'
    ],
    patterns: [
      /<\?php/,
      /\$\w+/,
      /\becho\s+/,
      /\bfunction\s+\w+\s*\(/,
      /\bclass\s+\w+/,
      /\b\$_(GET|POST|SESSION|COOKIE)\b/,
      /\bisset\s*\(/,
      /\bempty\s*\(/,
      /\barray\s*\(/,
      /\brequire(_once)?\s*\(/
    ],
    weight: 10,
    caseSensitive: true
  },
  {
    name: 'Go',
    id: 'go',
    extensions: ['.go'],
    keywords: [
      'package', 'import', 'func', 'var', 'const', 'type', 'struct',
      'interface', 'map', 'slice', 'channel', 'go', 'defer', 'select',
      'range', 'make', 'new', 'append', 'len', 'cap', 'fmt.Println'
    ],
    patterns: [
      /\bpackage\s+\w+/,
      /\bfunc\s+\w+\s*\(/,
      /\bfunc\s+\(\w+\s+\*?\w+\)\s+\w+/,
      /\btype\s+\w+\s+struct/,
      /\btype\s+\w+\s+interface/,
      /\bgo\s+\w+\s*\(/,
      /\bdefer\s+/,
      /\bselect\s*{/,
      /\brange\s+/,
      /\bfmt\.(Print|Sprint)/
    ],
    weight: 10,
    caseSensitive: true
  },
  {
    name: 'Rust',
    id: 'rust',
    extensions: ['.rs'],
    keywords: [
      'fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'impl',
      'trait', 'mod', 'pub', 'use', 'crate', 'self', 'super', 'match',
      'if', 'else', 'loop', 'while', 'for', 'in', 'break', 'continue',
      'return', 'println!', 'vec!', 'macro_rules!'
    ],
    patterns: [
      /\bfn\s+\w+\s*\(/,
      /\blet\s+(mut\s+)?\w+/,
      /\bstruct\s+\w+/,
      /\benum\s+\w+/,
      /\bimpl\s+/,
      /\btrait\s+\w+/,
      /\bmatch\s+\w+\s*{/,
      /\bprintln!\s*\(/,
      /\bvec!\s*\[/,
      /\bmacro_rules!\s+\w+/
    ],
    weight: 10,
    caseSensitive: true
  },
  {
    name: 'Ruby',
    id: 'ruby',
    extensions: ['.rb', '.rbw'],
    keywords: [
      'def', 'class', 'module', 'end', 'if', 'elsif', 'else', 'unless',
      'case', 'when', 'while', 'until', 'for', 'in', 'do', 'begin',
      'rescue', 'ensure', 'return', 'yield', 'puts', 'print', 'p'
    ],
    patterns: [
      /\bdef\s+\w+/,
      /\bclass\s+\w+/,
      /\bmodule\s+\w+/,
      /\bend\s*$/m,
      /\bputs\s+/,
      /\bprint\s+/,
      /\bp\s+/,
      /\b\w+\.each\s+do/,
      /\b@\w+/,
      /\b@@\w+/
    ],
    weight: 9,
    caseSensitive: true
  },
  {
    name: 'Bash',
    id: 'bash',
    extensions: ['.sh', '.bash'],
    keywords: [
      '#!/bin/bash', '#!/bin/sh', 'echo', 'printf', 'read', 'if', 'then',
      'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac',
      'function', 'return', 'exit', 'export', 'source', 'alias'
    ],
    patterns: [
      /^#!/,
      /\becho\s+/,
      /\bprintf\s+/,
      /\bif\s*\[/,
      /\bthen\s*$/m,
      /\bfi\s*$/m,
      /\bfor\s+\w+\s+in/,
      /\bwhile\s*\[/,
      /\bdo\s*$/m,
      /\bdone\s*$/m,
      /\$\{?\w+\}?/,
      /\bexport\s+\w+=/
    ],
    weight: 9,
    caseSensitive: true
  },
  {
    name: 'PowerShell',
    id: 'powershell',
    extensions: ['.ps1', '.psm1', '.psd1'],
    keywords: [
      'function', 'param', 'begin', 'process', 'end', 'if', 'elseif', 'else',
      'switch', 'foreach', 'while', 'do', 'until', 'try', 'catch', 'finally',
      'Write-Host', 'Write-Output', 'Get-', 'Set-', 'New-', 'Remove-'
    ],
    patterns: [
      /\bfunction\s+\w+/,
      /\bparam\s*\(/,
      /\bWrite-(Host|Output|Error|Warning|Verbose|Debug)/,
      /\b(Get|Set|New|Remove|Add|Clear|Copy|Move|Rename|Test)-\w+/,
      /\$\w+/,
      /\bforeach\s*\(/,
      /\bif\s*\(/,
      /\bswitch\s*\(/,
      /\btry\s*{/,
      /\bcatch\s*{/
    ],
    weight: 9,
    caseSensitive: false
  },
  {
    name: 'SQL',
    id: 'sql',
    extensions: ['.sql'],
    keywords: [
      'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE',
      'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION',
      'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON', 'GROUP BY',
      'ORDER BY', 'HAVING', 'UNION', 'DISTINCT', 'COUNT', 'SUM', 'AVG'
    ],
    patterns: [
      /\bSELECT\s+/i,
      /\bFROM\s+\w+/i,
      /\bWHERE\s+/i,
      /\bINSERT\s+INTO/i,
      /\bUPDATE\s+\w+\s+SET/i,
      /\bDELETE\s+FROM/i,
      /\bCREATE\s+(TABLE|VIEW|INDEX)/i,
      /\bJOIN\s+\w+\s+ON/i,
      /\bGROUP\s+BY/i,
      /\bORDER\s+BY/i
    ],
    weight: 10,
    caseSensitive: false
  },
  {
    name: 'CSS',
    id: 'css',
    extensions: ['.css'],
    keywords: [
      'color', 'background', 'font', 'margin', 'padding', 'border',
      'width', 'height', 'display', 'position', 'float', 'clear',
      'text-align', 'text-decoration', 'font-size', 'font-weight',
      'line-height', 'letter-spacing', 'word-spacing', 'white-space'
    ],
    patterns: [
      /\w+\s*{[^}]*}/,
      /\.[\w-]+\s*{/,
      /#[\w-]+\s*{/,
      /\w+:\s*[^;]+;/,
      /@media\s*\(/,
      /@import\s+/,
      /@keyframes\s+\w+/,
      /\brgb\s*\(/,
      /\brgba\s*\(/,
      /\bhsl\s*\(/
    ],
    weight: 8,
    caseSensitive: false
  },
  {
    name: 'HTML',
    id: 'html',
    extensions: ['.html', '.htm'],
    keywords: [
      'html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style',
      'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td',
      'form', 'input', 'button', 'textarea', 'select', 'option'
    ],
    patterns: [
      /<\/?[a-zA-Z][^>]*>/,
      /<!DOCTYPE\s+html>/i,
      /<html[^>]*>/,
      /<head[^>]*>/,
      /<body[^>]*>/,
      /<\w+\s+[^>]*>/,
      /<!--[\s\S]*?-->/,
      /<script[^>]*>/,
      /<style[^>]*>/,
      /<link[^>]*>/
    ],
    weight: 7,
    caseSensitive: false
  },
  {
    name: 'XML',
    id: 'xml',
    extensions: ['.xml', '.xsl', '.xsd'],
    keywords: [
      'xml', 'version', 'encoding', 'standalone', 'xmlns', 'xsi',
      'schemaLocation', 'noNamespaceSchemaLocation'
    ],
    patterns: [
      /<\?xml\s+version=/,
      /<\/?[a-zA-Z][\w:-]*[^>]*>/,
      /xmlns\s*=/,
      /<!--[\s\S]*?-->/,
      /<![CDATA\[[\s\S]*?\]\]>/,
      /<\w+:[\w-]+/,
      /\w+="[^"]*"/,
      /<\w+\s+[^>]*\/>/
    ],
    weight: 6,
    caseSensitive: false
  },
  {
    name: 'JSON',
    id: 'json',
    extensions: ['.json'],
    keywords: [
      'true', 'false', 'null'
    ],
    patterns: [
      /^\s*{[\s\S]*}\s*$/,
      /^\s*\[[\s\S]*\]\s*$/,
      /"\w+"\s*:/,
      /:\s*"[^"]*"/,
      /:\s*(true|false|null)\b/,
      /:\s*\d+(\.\d+)?/,
      /:\s*\[[\s\S]*\]/,
      /:\s*{[\s\S]*}/
    ],
    weight: 8,
    caseSensitive: true
  },
  {
    name: 'YAML',
    id: 'yaml',
    extensions: ['.yml', '.yaml'],
    keywords: [
      'true', 'false', 'null', 'yes', 'no', 'on', 'off'
    ],
    patterns: [
      /^\s*\w+:\s*/m,
      /^\s*-\s+/m,
      /^\s*---\s*$/m,
      /^\s*\.\.\.\s*$/m,
      /\w+:\s*$/m,
      /\w+:\s*[^\n]+$/m,
      /^\s*#[^\n]*$/m,
      /\|\s*$/m,
      />\s*$/m
    ],
    weight: 7,
    caseSensitive: false
  }
];

/**
 * 获取所有支持的语言列表
 */
export function getSupportedLanguages(): string[] {
  return LANGUAGE_RULES.map(rule => rule.id);
}

/**
 * 根据语言ID获取语言规则
 */
export function getLanguageRule(languageId: string): LanguageRule | undefined {
  return LANGUAGE_RULES.find(rule => rule.id === languageId);
}

/**
 * 根据文件扩展名获取可能的语言
 */
export function getLanguagesByExtension(extension: string): LanguageRule[] {
  return LANGUAGE_RULES.filter(rule => 
    rule.extensions.some(ext => 
      ext.toLowerCase() === extension.toLowerCase()
    )
  );
}

/**
 * 检查语言是否被支持
 */
export function isLanguageSupported(languageId: string): boolean {
  return LANGUAGE_RULES.some(rule => rule.id === languageId);
}