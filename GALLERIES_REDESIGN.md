# Galleries Page - 1:1 Template Recreation

## 概述

已成功将 `/galleries` 页面完全重构为与 v0 模板 (bRDdm9Y5xoY-1771909786126) 1:1 一致的暗色主题艺术画廊。

## 主要变更

### 1. 架构重构
- 移除了原有的 Header、Breadcrumb、Footer 组件
- 创建全屏沉浸式画廊体验
- 使用独立的 HTML 布局，不依赖全局 Layout

### 2. 核心组件 (新增)

#### React 组件
- `src/components/react/art-gallery-slider.tsx` - 主画廊滑块容器
- `src/components/react/artwork-card.tsx` - 单个作品卡片（带3D视差效果）
- `src/components/react/navigation-dots.tsx` - 底部导航指示点

#### 自定义 Hooks
- `src/hooks/use-slider-navigation.ts` - 键盘和导航控制
- `src/hooks/use-slider-drag.ts` - 鼠标/触摸拖拽支持
- `src/hooks/use-slider-wheel.ts` - 鼠标滚轮支持
- `src/hooks/use-color-extraction.ts` - 从图片提取主色调

#### 工具库
- `src/lib/color-extractor.ts` - Canvas API 图片颜色提取
- `src/lib/constants.ts` - 滑块行为常量配置
- `src/types/artwork.ts` - TypeScript 类型定义

### 3. 设计特性

#### 视觉效果
- **暗色主题**: 纯黑背景 (#000000)
- **动态背景**: 基于当前图片颜色的径向渐变
- **毛玻璃效果**: backdrop-filter blur(120px)
- **玻璃态卡片**: 白色半透明边框和背景
- **3D 视差**: rotateY 和视差偏移效果

#### 交互特性
- **键盘导航**: 左右箭头键、A/D 键、Home/End 键
- **鼠标拖拽**: 支持拖拽切换，带速度检测
- **触摸滑动**: 移动设备原生触摸支持
- **滚轮支持**: 鼠标滚轮切换图片
- **动画过渡**: Framer Motion 流畅动画

#### 响应式设计
- **桌面 (≥768px)**: 500x500px 卡片
- **平板 (640-767px)**: 400x400px 卡片
- **手机 (≤640px)**: 350x350px 卡片
- **小屏 (≤480px)**: 300x300px 卡片

### 4. 字体和排版
- **标题**: Georgia / Playfair Display (serif)
- **年份**: Courier New (monospace)
- **描述**: 系统默认 sans-serif

### 5. 颜色提取算法
使用 Canvas API 实时分析图片主色调：
1. 图片采样到 50x50 像素
2. 颜色量化（32 级）
3. 过滤极端亮度
4. 按频率排序
5. 确保颜色区分度（欧氏距离 >40）

## 文件结构

```
src/
├── components/
│   └── react/
│       ├── art-gallery-slider.tsx     # 主容器
│       ├── artwork-card.tsx           # 作品卡片
│       └── navigation-dots.tsx        # 导航点
├── hooks/
│   ├── use-slider-navigation.ts       # 导航钩子
│   ├── use-slider-drag.ts             # 拖拽钩子
│   ├── use-slider-wheel.ts            # 滚轮钩子
│   └── use-color-extraction.ts        # 颜色钩子
├── lib/
│   ├── color-extractor.ts             # 颜色提取
│   └── constants.ts                   # 常量配置
├── types/
│   └── artwork.ts                     # 类型定义
├── styles/
│   └── art-gallery-slider.css         # 完整样式
└── pages/
    └── galleries/
        └── index.astro                # 入口页面
```

## 性能优化

1. **will-change**: 对动画元素使用 will-change 提示
2. **图片优化**: 使用 buildGalleryImageSources 生成响应式图片
3. **颜色缓存**: 提取的颜色存储在 state 中避免重复计算
4. **动画优化**: 使用 Framer Motion 的 GPU 加速动画
5. **防抖和节流**: 滚轮和拖拽事件经过优化处理

## 使用方法

### 访问画廊
```
http://localhost:4321/galleries
```

### 键盘快捷键
- `←` / `A`: 上一张
- `→` / `D`: 下一张  
- `Home`: 第一张
- `End`: 最后一张

### 触摸手势
- 左滑: 下一张
- 右滑: 上一张

### 鼠标操作
- 拖拽: 切换图片
- 滚轮: 切换图片
- 点击指示点: 跳转到指定图片

## 技术栈

- **框架**: Astro 5.x + React 19
- **动画**: Framer Motion 12.x
- **样式**: CSS + Tailwind CSS 4.x (用于工具类)
- **类型**: TypeScript 5.x
- **图片优化**: Sharp (内置于 Astro)

## 与模板的一致性

✅ **布局**: 全屏黑色背景，居中卡片
✅ **标题**: 左上角 "Gallery" serif 字体
✅ **计数器**: 右上角 "02 / 07" 格式
✅ **卡片设计**: 玻璃态边框 + 圆角
✅ **导航点**: 底部居中，活动点拉长动画
✅ **键盘提示**: 左下角 ← → navigate
✅ **动画**: 淡入放大 + 3D 视差
✅ **颜色系统**: 动态背景径向渐变
✅ **交互**: 拖拽、滚轮、键盘全支持

## 注意事项

1. 需要在支持 `backdrop-filter` 的现代浏览器中查看最佳效果
2. 颜色提取需要图片支持 CORS（已设置 crossOrigin="anonymous"）
3. 移动端性能可能受设备限制，建议使用中高端设备测试
4. 确保图片路径正确且可访问

## 未来改进建议

1. 添加图片预加载逻辑
2. 实现虚拟滚动（大量图片时）
3. 添加全屏模式
4. 支持图片缩放功能
5. 添加分享和下载功能
6. 优化移动端性能

---

重构完成时间: 2025-02-24
参考模板: bRDdm9Y5xoY-1771909786126
