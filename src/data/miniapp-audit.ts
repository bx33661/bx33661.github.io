export interface PackageTypeSpec {
  name: string;
  kindKey: string;
  tone: "main" | "sub" | "independent" | "resource";
  detailKey: string;
}

export interface BinaryLayerSpec {
  nameKey: string;
  english: string;
  detailKey: string;
}

export interface VersionCardSpec {
  version: string;
  labelKey: string;
  files: ReadonlyArray<{ name: string; tagKey: string }>;
}

export interface MiniappStageSpec {
  id: "collect" | "restore" | "surface" | "verify" | "report";
  labelKey: string;
  code: string;
  titleKey: string;
  detailKey: string;
  artifact: string;
}

export const CACHE_PATH_SEGMENTS: ReadonlyArray<{ text: string; translate?: boolean }> = [
  { text: "radium" },
  { text: "users" },
  { text: "<账号哈希>", translate: true },
  { text: "applet" },
  { text: "packages" },
  { text: "<AppID>" },
  { text: "<版本>", translate: true },
];

export const PACKAGE_TYPES: readonly PackageTypeSpec[] = [
  { name: "__APP__.wxapkg", kindKey: "主包", tone: "main", detailKey: "App 启动逻辑、主页面、tabBar、分包清单" },
  { name: "xxxx.wxapkg", kindKey: "普通分包", tone: "sub", detailKey: "进入对应页面时下载" },
  { name: "yyyy.wxapkg", kindKey: "独立分包", tone: "independent", detailKey: "可不加载主包直接启动" },
  { name: "zzzz.wxapkg", kindKey: "扩展包", tone: "resource", detailKey: "插件或其他资源" },
];

export const BINARY_LAYERS: readonly BinaryLayerSpec[] = [
  { nameKey: "包头", english: "HEADER", detailKey: "标识 / 段长 / 索引长" },
  { nameKey: "文件索引表", english: "INDEX", detailKey: "路径 / 偏移 / 大小" },
  { nameKey: "文件内容区", english: "DATA BODY", detailKey: "按索引定位文件数据" },
  { nameKey: "包尾校验标记", english: "TRAILER", detailKey: "结束与校验信息" },
];

export const VERSION_CARDS: readonly VersionCardSpec[] = [
  {
    version: "12",
    labelKey: "版本 12",
    files: [
      { name: "__APP__.wxapkg", tagKey: "主包" },
      { name: "xxxxx.wxapkg", tagKey: "分包 A" },
      { name: "yyyyy.wxapkg", tagKey: "分包 B" },
    ],
  },
  {
    version: "13",
    labelKey: "版本 13",
    files: [
      { name: "__APP__.wxapkg", tagKey: "主包" },
      { name: "xxxxx.wxapkg", tagKey: "分包 A" },
    ],
  },
];

export const AUDIT_AGENTS: ReadonlyArray<readonly [string, string]> = [
  ["material-check", "材料与完整性感知"],
  ["attack-surface", "攻击面与接口清单"],
  ["secret-scan", "硬编码凭证扫描"],
  ["authz-analyzer", "越权与权限矩阵"],
  ["payment-audit", "支付安全检查"],
  ["dataflow-tracer", "污点与数据流追踪"],
  ["privacy-compliance", "用户隐私合规"],
  ["dynamic-tester", "动态验证与 PoC"],
  ["code-restorer", "LLM 语义逆向还原"],
  ["report-builder", "审计报告生成"],
];

export const DIAGRAM_FIGURES = {
  cache: {
    ariaLabelKey: "微信小程序缓存目录和包类型",
    eyebrow: "CACHE TOPOLOGY",
    titleKey: "从账号目录走到版本包",
    footnoteKey: "同一个 AppID 下可以有多个版本；实际包名和目录内容以采集结果为准。",
  },
  package: {
    ariaLabelKey: "wxapkg 文件结构",
    eyebrow: "BINARY PACKAGE",
    titleKey: ".wxapkg 的四层结构",
    footnoteKey: "读取索引中的路径、offset 与 size，再从数据区截取对应文件。",
  },
  versions: {
    ariaLabelKey: "同一小程序的两个版本包目录",
    eyebrow: "VERSION LAYOUT",
    titleKey: "同一 AppID，不同版本分别存放",
    footnoteKey: "采集时先按版本归档，避免将旧分包误配到新主包。",
  },
  agents: {
    ariaLabelKey: "miniapp-audit 的十个审计子模块",
    eyebrow: "AGENT ORCHESTRATION",
    titleKey: "miniapp-audit · 主编排引擎",
    footnoteKey: "模块各自留下中间材料，最终由报告阶段关联证据与结论。",
  },
} as const;

export const MINIAPP_STAGES: readonly MiniappStageSpec[] = [
  {
    id: "collect",
    labelKey: "采集",
    code: "01 / COLLECT",
    titleKey: "先确认包是否齐全",
    detailKey: "对照主包、普通分包和独立分包，记录版本与来源；缺失材料先标记，不把未覆盖代码当作安全结论。",
    artifact: "__APP__.wxapkg + package inventory",
  },
  {
    id: "restore",
    labelKey: "还原",
    code: "02 / RESTORE",
    titleKey: "重建可读的工程树",
    detailKey: "解包 wxapkg，恢复配置、页面与脚本，并将混淆代码还原到足以追踪调用链的程度。",
    artifact: "app-config.json + pages/*",
  },
  {
    id: "surface",
    labelKey: "建模",
    code: "03 / MAP",
    titleKey: "把接口和身份放到一张图里",
    detailKey: "提取请求端点、参数、凭据与页面入口，再按用户、角色和租户建立测试矩阵。",
    artifact: "endpoints.txt + identity matrix",
  },
  {
    id: "verify",
    labelKey: "验证",
    code: "04 / VERIFY",
    titleKey: "用第二身份验证假设",
    detailKey: "让证据链从前端调用延伸到实际请求与响应；没有必要的账号或资源时，明确保留为待验证。",
    artifact: "request / response / evidence refs",
  },
  {
    id: "report",
    labelKey: "报告",
    code: "05 / REPORT",
    titleKey: "让每条结论能回溯",
    detailKey: "将确认、排除和受阻的发现分开记录，并关联原始包、源码位置与复现材料。",
    artifact: "artifact-manifest.json + finding",
  },
];
