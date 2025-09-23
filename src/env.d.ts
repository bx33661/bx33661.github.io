/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
interface ImportMetaEnv {
  // 环境变量类型定义
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

type ThemeName = 'light' | 'dark'

interface ThemeController {
  get(): ThemeName
  set(theme: ThemeName): ThemeName
  toggle(): ThemeName
  resetToSystem(): void
}

interface Window {
  __BX_THEME__?: ThemeController
}
