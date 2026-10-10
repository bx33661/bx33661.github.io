# SEO 状态统一与旧项目路径 — 2026-10-10

## 百度状态来源

部署后和每日通知都调用 `.github/workflows/baidu-notify.yml`。同一
`baidu-published-ledger` job 并发组覆盖读取、通知、持久化，运行中任务不取消。
执行时检出最新 main，下载正式站的当前 sitemap/HTML；不通知尚未上线的构建。
唯一长期状态是 main 上的 `.baidu-push-cache.json`，不再维护每日独立写入的 Actions cache。

首次运行保留 Git 状态，再只读恢复旧 `baidu-daily-` 缓存。迁移仅合并与正式站
当前内容指纹相同的成功记录：URL 出现在 pushed 数组里、过期版本和未推送内容都不算成功。
随后保存 ledgerVersion=1；后续运行不再恢复旧缓存，推送脚本保留版本标记。
默认每次最多10条，配额耗尽保留待推送；API 整批确认成功才写相应内容指纹。
部分批次失败时仍持久化之前确认的记录。缓存提交带 [skip ci]，不形成部署循环。
遇到同时进行的内容提交，最多三次 fetch/rebase/push；持久化失败使工作流失败，
而不是把“HTTP 已接收”误报成“记录已保存”。

旧工作流运行应先结束再上线新版，避免尚在执行的旧 writer 与新 ledger 同时写入。
本地验证不调用百度 API。迁移后的实际队列须以首次生产运行日志为准。
Google/Baidu/IndexNow 接收通知均不等于收录。

## 列表摘要

/blog/ 使用技术文章归档摘要，/notes/ 使用学习笔记分类索引摘要。
标题、路径、分页 noindex 和正文不变；description 同时供 meta/OG/结构化数据使用。

## 旧 403 中的项目路径

复查 /blog/spring-learning-analysis 和 /blog/bxvite/：普通 HTTP 返回200。
/projects/pure-auto-codeql/problem/：当前404。

Git 历史 7c0fd5f 的 src/content/projects/pure-auto-codeql/problem.md 专门描述
CodeQL 查询门槛、CVE 研究链路、多语言重复工作与审计产物目标；
3c09033 删除了该文档。当前项目数据 src/data/academic/projects/pureautocodeql.json
仅提供项目摘要、GitHub 仓库和 codeql-learning 相关文章，没有等价 Problem 文档。
因此本次保留真实404，不跳首页、不跳主题不同的 CodeQL 学习文章，也不把外部仓库
当作该文档的等价迁移目标。以后恢复原文或提供等价说明时，再加精准跳转。
普通 HTTP200 不是 Googlebot 实际访问结果；GSC 的旧403报告需等待重新抓取。
