# Analytics 配置说明

## 当前状态

仓库已清理早期未接入的 `GoogleAnalytics` / `GoogleTagManager` / `Analytics` 占位组件及对应未使用的环境变量（`PUBLIC_GOOGLE_ANALYTICS_ID`、`PUBLIC_GTM_ID`、`PUBLIC_POSTHOG_KEY`、`PUBLIC_POSTHOG_HOST`），默认构建**不会**自动注入任何第三方统计脚本。

当前仅在 [`src/config/env.ts`](../src/config/env.ts) 中保留了统一的开关导出：

- `ENABLE_ANALYTICS = import.meta.env.PUBLIC_ENABLE_ANALYTICS === "true"`

## 验证与生产构建开关机制

为避免本地校验与 CI 浏览器测试请求外网统计接口：

1. `npm run verify:quick` 与 `npm run verify:full` 会强制设置 `PUBLIC_ENABLE_ANALYTICS=false` 与 `PUBLIC_ENABLE_COMMENTS=false`。
2. 在 GitHub Actions（[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)）的 `main` 分支部署流程中，若仓库变量 `vars.PUBLIC_ENABLE_ANALYTICS == 'true'` 或 `vars.PUBLIC_ENABLE_COMMENTS == 'true'`，将在 `verify:full` 通过后执行一次正式环境重编（`npm run build && npm run smoke:dist`），确保线上产物应用生产环境变量。

## 若需接入第三方统计脚本

1. 如使用常见平台，`src/layouts/Layout.astro`、`public/_headers` 与 [`docs/EDGE_SETUP.md`](./EDGE_SETUP.md) 中的 CSP 已预放行：
   - `script-src`: `https://www.googletagmanager.com`、`https://analytics.ahrefs.com`
   - `connect-src`: `https://www.google-analytics.com`、`https://analytics.ahrefs.com`、`https://app.posthog.com`
     若更换其他统计域，请同步更新上述三处的 CSP 配置。
2. 仅在 `ENABLE_ANALYTICS` 为 `true`（且处于生产环境）时，在 `src/layouts/Layout.astro` 中挂载对应脚本并读取自定义公开环境变量。
3. 在 GitHub 仓库的 `Settings → Secrets and variables → Actions → Variables` 中设置 `PUBLIC_ENABLE_ANALYTICS=true` 及所需公开 ID。
