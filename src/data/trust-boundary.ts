export type ScenarioId = "false-positive" | "false-negative" | "true-positive";

export interface ScenarioSpec {
  attackerPayload: string;
  inputTitle: string;
  inputDetail: string;
  boundaryClass: "blocked" | "breached" | "permeable";
  boundaryText: string;
  sourceTitle: string;
  sourceDetail: string;
  sinkTitle: string;
  sinkDetail: string;
  llmBadge: string;
  llmHeadline: string;
  llmDesc: string;
  realityBadge: string;
  realityHeadline: string;
  realityDesc: string;
}

export const SCENARIO_TABS: ReadonlyArray<{
  id: ScenarioId;
  domId: string;
  labelKey: string;
  tagKey: string;
  tagClass: string;
}> = [
  { id: "false-positive", domId: "tab-fp", labelKey: "场景 A：本地配置任意写", tagKey: "典型误报", tagClass: "tag-fp" },
  {
    id: "false-negative",
    domId: "tab-fn",
    labelKey: "场景 B：未鉴权 /admin 接口",
    tagKey: "隐蔽漏报",
    tagClass: "tag-fn",
  },
  { id: "true-positive", domId: "tab-tp", labelKey: "场景 C：直接入参 SSRF", tagKey: "真实高危", tagClass: "tag-tp" },
];

export const TRUST_SCENARIOS: Record<ScenarioId, ScenarioSpec> = {
  "false-positive": {
    attackerPayload: "试图传入 ../../etc/passwd",
    inputTitle: "本地静态配置",
    inputDetail: "config['backup_path']",
    boundaryClass: "blocked",
    boundaryText: "⛔ 边界阻断：攻击者无权限修改本地配置文件",
    sourceTitle: "系统内部配置",
    sourceDetail: "受管理员与系统保护 (Trusted)",
    sinkTitle: "危险文件写入",
    sinkDetail: "open(path, 'w').write()",
    llmBadge: "🚨 误报高危",
    llmHeadline: "模式匹配：Source → open() 路径穿越",
    llmDesc: "LLM 机械地追踪到了数据流走向危险 Sink，但脱离了部署事实，将受信任的本地配置文件当成了外部不可信输入。",
    realityBadge: "🛡️ 误报 (False Positive)",
    realityHeadline: "攻击者不可控 Source，漏洞无法闭环",
    realityDesc: "在远程未认证威胁模型下，该路径只由内部运维配置注入，攻击者无法从外部修改，不构成可利用安全事件。",
  },
  "false-negative": {
    attackerPayload: "POST /admin/import?url=http://169.254.169.254",
    inputTitle: "管理端点 (无鉴权)",
    inputDetail: "/admin/import (未配置拦截中间件)",
    boundaryClass: "breached",
    boundaryText: "⚠️ 边界失效：路由未受保护，外部请求长驱直入",
    sourceTitle: "外部未经验证入参",
    sourceDetail: "String url (攻击者直接可控)",
    sinkTitle: "内部请求发起点",
    sinkDetail: "importer.load(url) → SSRF",
    llmBadge: "😴 误判低危 / 忽略",
    llmHeadline: "假定边界：看到 /admin/ 便以为安全",
    llmDesc:
      "模型根据路径字符语义做出了错误的“安全假设”，认为管理接口必然受严密认证保护，从而降低风险评级甚至直接忽略。",
    realityBadge: "💥 严重漏报 (False Negative)",
    realityHeadline: "真实网关缺失鉴权，致命远程 SSRF",
    realityDesc: "生产环境中该路由并未绑定身份认证过滤器，外部攻击者可直接触发，原本高危的 SSRF 漏洞被模型错误放过。",
  },
  "true-positive": {
    attackerPayload: "GET /api/fetch?url=http://127.0.0.1:8080",
    inputTitle: "公开 API 端点",
    inputDetail: "request.args['url']",
    boundaryClass: "permeable",
    boundaryText: "⚡ 边界通透：公开业务逻辑允许外部入参穿透",
    sourceTitle: "Untrusted Client Input",
    sourceDetail: "外部网络参数 (Attacker-Controlled)",
    sinkTitle: "网络发包执行点",
    sinkDetail: "httpClient.get(url)",
    llmBadge: "🎯 准确报出",
    llmHeadline: "发现可控入参直达 HTTP 发包函数",
    llmDesc: "代码直接接收了客户端请求参数，并在未做白名单校验的情况下向目标地址发起了网络请求。",
    realityBadge: "🔥 真实漏洞 (True Positive)",
    realityHeadline: "威胁模型吻合：攻击者真实可控",
    realityDesc: "攻击者控制的 Source 成功穿越边界直达危险 Sink，满足真实漏洞的必要条件，属于有效高危漏洞报告。",
  },
};
