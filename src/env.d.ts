/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
interface ImportMetaEnv {
    // 环境变量类型定义
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }