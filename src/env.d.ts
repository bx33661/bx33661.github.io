/// <reference types="astro/client" />

interface Window {
  __BX_SW_REGISTERED__?: boolean;
  theme?: {
    readonly themeValue: "light" | "dark";
    setPreference: () => void;
    reflectPreference: () => void;
    getTheme: () => "light" | "dark";
    setTheme: (val: "light" | "dark") => void;
  };
}
