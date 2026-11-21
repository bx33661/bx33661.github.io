export type WifiDiagramVariant = "hardware" | "discovery" | "frames" | "layers" | "evidence" | "keys";

export interface WifiDiagramMeta {
  number: string;
  title: string;
  note: string;
  desktopHeight: number;
  mobileHeight: number;
}

export const WIFI_DIAGRAM_INFO: Record<WifiDiagramVariant, WifiDiagramMeta> = {
  hardware: {
    number: "01",
    title: "无线设备进入虚拟机的两条路径",
    note: "USB 直通交付物理无线设备；NAT 或桥接提供网络连接，不自动交付射频控制能力。",
    desktopHeight: 294,
    mobileHeight: 488,
  },
  discovery: {
    number: "02",
    title: "802.11 网络发现时序",
    note: "时间沿纵轴向下。Beacon 为周期性广播；Probe 交换属于主动发现，尚未进入关联与密钥建立。",
    desktopHeight: 410,
    mobileHeight: 410,
  },
  keys: {
    number: "03",
    title: "四次握手中的密钥确认与分发",
    note: "典型 WPA2 初始连接的简化时序，不是本次 CAP 的实测结果。双方预先具备 PMK，PTK 在本地派生，不在空口发送。",
    desktopHeight: 528,
    mobileHeight: 564,
  },
  frames: {
    number: "04",
    title: "抓包文件中的元数据与无线帧",
    note: "布局为逻辑示意，不按字节数等比例绘制。Radiotap 属于捕获元数据，字段是否存在取决于驱动。",
    desktopHeight: 300,
    mobileHeight: 390,
  },
  layers: {
    number: "05",
    title: "无线链路保护与端到端保护",
    note: "WPA2/WPA3 的无线保护终止于 AP；图中的 TLS 会话以应用终端与远端服务为端点。",
    desktopHeight: 366,
    mobileHeight: 610,
  },
  evidence: {
    number: "06",
    title: "连接建立与检测响应的证据矩阵",
    note: "协议状态和安全平台响应分属两条观察链；图中列出验收条件，不表示本次全部完成。",
    desktopHeight: 0,
    mobileHeight: 0,
  },
};

export interface EvidenceRow {
  layer: string;
  transition: string;
  evidence: string;
  boundary: string;
  outline?: boolean;
  divider?: boolean;
}

export const EVIDENCE_ROWS: readonly EvidenceRow[] = [
  {
    layer: "无线发现",
    transition: "扫描 → 可见",
    evidence: "Beacon / Probe Response",
    boundary: "网络可见，尚未建立连接",
  },
  {
    layer: "链路建立",
    transition: "认证 → 关联",
    evidence: "响应状态码 / 关联日志",
    boundary: "关联不等于密钥或 IP 就绪",
  },
  {
    layer: "业务接入",
    transition: "链路 → IP → 业务",
    evidence: "密钥记录（如适用） / IP / 业务结果",
    boundary: "按实际启用的保护机制验收",
  },
  {
    layer: "平台检测",
    transition: "发现 → 分类 → 告警",
    evidence: "BSSID / 事件时间 / 告警日志",
    boundary: "告警不等于已执行阻断",
    outline: true,
    divider: true,
  },
  {
    layer: "响应恢复",
    transition: "处置 → 复测 → 恢复",
    evidence: "执行记录 / 终端复测结果",
    boundary: "单次结果限定于当次条件",
    outline: true,
  },
];

export const HARDWARE_NODES = [
  {
    desktop: [20, 60] as const,
    mobile: [40, 28] as const,
    label: "USB 外接网卡",
    code: "0bda:b812",
    translateCode: false,
    focus: false,
  },
  {
    desktop: [260, 60] as const,
    mobile: [40, 156] as const,
    label: "VMware USB 直通",
    code: "物理设备 → 客户机",
    translateCode: true,
    focus: false,
  },
  {
    desktop: [500, 60] as const,
    mobile: [40, 284] as const,
    label: "Kali 无线接口",
    code: "phy#1 / wlan0",
    translateCode: false,
    focus: true,
  },
] as const;

export const KEY_EXCHANGE_STEPS = [
  { y: 128, label: "M1 · ANonce", detail: "提供本轮随机数", apToSta: true },
  { y: 224, label: "M2 · SNonce + MIC", detail: "AP 派生 PTK 并校验", apToSta: false },
  { y: 320, label: "M3 · MIC + Key Data", detail: "分发受保护的 GTK 等", apToSta: true },
  { y: 416, label: "M4 · MIC", detail: "确认本轮交换", apToSta: false },
] as const;

export const DISCOVERY_MESSAGES = [
  { y: 146, code: "Beacon", apToSta: true, secondary: false },
  { y: 253, code: "Probe Request", apToSta: false, secondary: true },
  { y: 310, code: "Probe Response", apToSta: true, secondary: false },
] as const;

export const LAYER_NODES = [
  {
    mobileY: 80,
    desktopX: 26,
    label: "无线终端 STA",
    mobileDetail: "应用 / TLS 客户端",
    desktopDetail: "应用 / TLS 客户端",
  },
  {
    mobileY: 270,
    desktopX: 280,
    label: "接入点 AP",
    mobileDetail: "转发无线与上联流量",
    desktopDetail: "链路保护在此终止",
  },
  {
    mobileY: 460,
    desktopX: 534,
    label: "远端服务端",
    mobileDetail: "TLS 服务端",
    desktopDetail: "TLS 服务端",
  },
] as const;

export const FRAME_SEGMENTS = [
  {
    mobile: { x: 20, y: 65, width: 280, detail: "接收功率 / 频率 / 速率等" },
    desktop: { x: 20, y: 70, width: 190, detail: "捕获元数据" },
    label: "Radiotap",
  },
  {
    mobile: { x: 20, y: 155, width: 280, detail: "类型 / 地址 / Protected 标志" },
    desktop: { x: 210, y: 70, width: 260, detail: "帧类型 / 地址 / 标志" },
    label: "802.11 MAC header",
  },
  {
    mobile: { x: 20, y: 245, width: 280, detail: "管理信息或数据载荷" },
    desktop: { x: 470, y: 70, width: 230, detail: "管理信息或数据载荷" },
    label: "Frame body + FCS*",
  },
] as const;

export type WifiPanelVariant =
  | "scope"
  | "selection"
  | "fieldnotes"
  | "glossary"
  | "spectrum"
  | "timeline"
  | "exchange"
  | "verdict"
  | "hypotheses"
  | "availability"
  | "password";

export type WifiPanelListVariant = "timeline" | "password" | "spectrum" | "verdict" | "hypotheses" | "availability";

export interface WifiPanelListConfig {
  tag: "ol" | "ul";
  listClass: string;
  markerClass: string;
  markerHidden?: boolean;
  wrapContent: boolean;
  detailClass?: string;
  detailLabel?: string;
  footnotePrefix?: string;
  hasFootnote: boolean;
}

export const SPECTRUM_MARKS = ["OPEN", "OWE", "LEGACY", "LEGACY", "PSK", "SAE"] as const;

export const VERDICT_LABELS = ["尚无泄露证据", "应用未加密", "可见内容构成风险", "应用保护仍存在"] as const;

const PATH_CONFIG: WifiPanelListConfig = {
  tag: "ol",
  listClass: "wk-path",
  markerClass: "wk-stop",
  markerHidden: true,
  wrapContent: true,
  detailClass: "wk-path-detail",
  hasFootnote: true,
};

export const WIFI_PANEL_LIST_CONFIGS: Record<WifiPanelListVariant, WifiPanelListConfig> = {
  timeline: PATH_CONFIG,
  password: PATH_CONFIG,
  spectrum: {
    tag: "ul",
    listClass: "wk-modes",
    markerClass: "wk-mode-mark",
    markerHidden: true,
    wrapContent: true,
    footnotePrefix: "核对：",
    hasFootnote: true,
  },
  verdict: {
    tag: "ol",
    listClass: "wk-decisions",
    markerClass: "wk-verdict-label",
    wrapContent: false,
    hasFootnote: false,
  },
  hypotheses: {
    tag: "ol",
    listClass: "wk-branches",
    markerClass: "wk-branch-mark",
    wrapContent: true,
    detailLabel: "取证",
    footnotePrefix: "判别：",
    hasFootnote: true,
  },
  availability: {
    tag: "ol",
    listClass: "wk-layer-list",
    markerClass: "wk-layer",
    wrapContent: true,
    footnotePrefix: "观测：",
    hasFootnote: true,
  },
};
