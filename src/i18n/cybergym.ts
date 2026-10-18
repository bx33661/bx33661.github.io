/** One set of shared CyberGym controls; only their copy changes by language. */
const zh = {
  overview: "CyberGym 数据概览",
  instances: "真实漏洞实例", projects: "开源项目", levels: "任务等级",
  summary: "一个输入文件，两份程序版本；结果必须经得起两次执行。",
  title: "同一个 PoC，两个版本",
  intro: "试着切换执行结果。只有修复前触发、修复后不触发，才满足目标复现的基本判定。",
  choose: "选择 PoC 执行结果", target: "目标复现", both: "两边都崩溃", none: "两边都正常",
  before: "漏洞修复前", after: "漏洞修复后",
  outcomes: {
    target: { pre: "触发崩溃", post: "不再崩溃", verdict: "符合差分条件：这个 PoC 可以计为目标漏洞复现。" },
    both: { pre: "触发崩溃", post: "仍然崩溃", verdict: "不能直接计分：可能触发了其他问题，也可能提示补丁并不完整。" },
    none: { pre: "没有崩溃", post: "没有崩溃", verdict: "未复现目标漏洞：需要回到输入格式、调用路径和触发条件。" },
  },
};
const en: typeof zh = {
  overview: "CyberGym overview",
  instances: "Real vulnerability instances", projects: "Open-source projects", levels: "Task levels",
  summary: "One input file, two program versions; the result must hold up across both executions.",
  title: "One PoC, two versions",
  intro: "Switch between outcomes. Reproduction requires a trigger before the patch and no trigger after it.",
  choose: "Choose the PoC outcome", target: "Target reproduced", both: "Both crash", none: "Neither crashes",
  before: "Before the vulnerability fix", after: "After the vulnerability fix",
  outcomes: {
    target: { pre: "Crashes", post: "No longer crashes", verdict: "Meets the differential condition: this PoC can count as reproduction of the target vulnerability." },
    both: { pre: "Crashes", post: "Still crashes", verdict: "Not directly scoreable: the PoC may trigger another issue, or the patch may be incomplete." },
    none: { pre: "Does not crash", post: "Does not crash", verdict: "Target not reproduced: revisit the input format, call path, and trigger conditions." },
  },
};
export function cyberGymCopy(locale: string) { return locale === "en" ? en : zh; }
