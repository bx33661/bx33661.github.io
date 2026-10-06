/// <reference types="astro/client" />

interface Window {
  theme?: {
    readonly themeValue: "light" | "dark";
    setPreference: () => void;
    reflectPreference: () => void;
    getTheme: () => "light" | "dark";
    setTheme: (val: "light" | "dark") => void;
  };
}
