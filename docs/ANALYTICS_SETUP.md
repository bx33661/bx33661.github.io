# Google Analytics 配置指南

## 概述

本项目支持多种分析工具的集成，包括：
- Google Analytics 4 (GA4)
- Google Tag Manager (GTM)
- PostHog

## 配置步骤

### 1. 获取 Google Analytics 追踪 ID

1. 访问 [Google Analytics](https://analytics.google.com/)
2. 创建新的 GA4 属性
3. 获取测量 ID（格式：G-XXXXXXXXXX）

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# Google Analytics 配置
PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
PUBLIC_ENABLE_ANALYTICS=true

# Google Tag Manager 配置（可选）
PUBLIC_GTM_ID=GTM-XXXXXXX

# PostHog 配置（可选）
PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxx
PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

### 3. 生产环境配置

对于生产环境，请在部署平台设置相应的环境变量：

#### Vercel
```bash
vercel env add PUBLIC_GOOGLE_ANALYTICS_ID
vercel env add PUBLIC_ENABLE_ANALYTICS
```

#### Netlify
在 Netlify 控制台的 Environment Variables 中添加相应变量。

#### GitHub Pages
在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加：
- `PUBLIC_GOOGLE_ANALYTICS_ID`
- `PUBLIC_ENABLE_ANALYTICS`

## 功能特性

### 隐私保护
- 自动 IP 匿名化
- GDPR 合规配置
- 禁用广告个性化

### 性能优化
- 异步加载脚本
- 开发环境禁用
- 错误处理

### 开发体验
- 开发环境模拟函数
- 控制台调试信息
- 环境变量验证

## 使用方法

### 基本事件追踪

```javascript
// 页面浏览
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: 'Custom Title',
  page_location: 'https://example.com/page'
});

// 自定义事件
gtag('event', 'click', {
  event_category: 'engagement',
  event_label: 'button'
});
```

### 电子商务追踪

```javascript
// 购买事件
gtag('event', 'purchase', {
  transaction_id: '12345',
  value: 25.42,
  currency: 'USD',
  items: [{
    item_id: 'SKU123',
    item_name: 'Product Name',
    category: 'Category',
    quantity: 1,
    price: 25.42
  }]
});
```

## 故障排除

### 常见问题

1. **分析数据不显示**
   - 检查环境变量是否正确设置
   - 确认在生产环境中运行
   - 验证 GA 追踪 ID 格式

2. **开发环境中的警告**
   - 这是正常的，开发环境会禁用分析工具
   - 查看控制台的模拟函数调用

3. **GDPR 合规性**
   - 项目已配置基本的隐私保护
   - 根据需要添加 Cookie 同意横幅

### 调试工具

使用 Google Analytics Debugger 浏览器扩展来调试追踪问题。

## 最佳实践

1. **数据质量**
   - 设置适当的过滤器排除内部流量
   - 定期检查数据准确性

2. **性能影响**
   - 使用异步加载
   - 避免阻塞渲染

3. **隐私合规**
   - 实施适当的数据保护措施
   - 提供用户选择退出的选项

## 相关文件

- `src/components/GoogleAnalytics.astro` - GA4 组件
- `src/components/GoogleTagManager.astro` - GTM 组件
- `src/components/Analytics.astro` - 统一分析组件
- `src/config/env.ts` - 环境变量配置