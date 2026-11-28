import { SITE, type ThemePreset } from "../config.ts";

export interface ThemeAccentPalette {
  label: string;
  light: string;
  dark: string;
  ogGlow: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeAccentPalette> = {
  cobalt: {
    label: "Cobalt",
    light: "#1158d1",
    dark: "#78b8ff",
    ogGlow: "rgba(120, 184, 255, 0.22)",
  },
  emerald: {
    label: "Emerald",
    light: "#0f766e",
    dark: "#4ade80",
    ogGlow: "rgba(74, 222, 128, 0.20)",
  },
  amber: {
    label: "Amber",
    light: "#b45309",
    dark: "#fbbf24",
    ogGlow: "rgba(251, 191, 36, 0.20)",
  },
  violet: {
    label: "Violet",
    light: "#6d28d9",
    dark: "#c084fc",
    ogGlow: "rgba(192, 132, 252, 0.22)",
  },
  rose: {
    label: "Rose",
    light: "#be123c",
    dark: "#fb7185",
    ogGlow: "rgba(251, 113, 133, 0.20)",
  },
  slate: {
    label: "Slate",
    light: "#334155",
    dark: "#94a3b8",
    ogGlow: "rgba(148, 163, 184, 0.20)",
  },
};

export const THEME_PRESET_NAMES = Object.keys(THEME_PRESETS) as ThemePreset[];

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

/** Resolve active light/dark accent colors from `SITE.theme` preset + optional overrides. */
export function resolveThemeAccent(theme: {
  preset: ThemePreset;
  accentLight?: string;
  accentDark?: string;
} = SITE.theme): { light: string; dark: string; ogGlow: string } {
  const base = THEME_PRESETS[theme.preset] ?? THEME_PRESETS.cobalt;
  const light = theme.accentLight && isValidHexColor(theme.accentLight) ? theme.accentLight.trim() : base.light;
  const dark = theme.accentDark && isValidHexColor(theme.accentDark) ? theme.accentDark.trim() : base.dark;
  return {
    light,
    dark,
    ogGlow: base.ogGlow,
  };
}
