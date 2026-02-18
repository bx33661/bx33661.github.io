export const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'midnight', label: 'Dark' },
  { value: 'retro', label: 'Retro' },
] as const

export type ThemeName = (typeof THEME_OPTIONS)[number]['value']

export const THEME_NAMES: ThemeName[] = THEME_OPTIONS.map((theme) => theme.value)

export const THEME_STORAGE_KEY = 'theme'
export const THEME_DARK_PREFERENCE_KEY = 'theme-dark-preference'
export const THEME_CHANGE_EVENT = 'bx-theme-change'

export const THEME_LEGACY_MAP: Record<string, ThemeName> = {
  dark: 'midnight',
  dim: 'midnight',
  synthwave: 'midnight',
  valentine: 'retro',
}

export const DARK_THEME_NAMES: ThemeName[] = ['midnight']

export const THEME_RUNTIME_COLORS: Record<ThemeName, string> = {
  light: '#ffffff',
  midnight: '#1d2021',
  retro: '#ffffff',
}

const THEME_NAME_SET = new Set<ThemeName>(THEME_NAMES)
const DARK_THEME_SET = new Set<ThemeName>(DARK_THEME_NAMES)

export function isSupportedTheme(value: unknown): value is ThemeName {
  return typeof value === 'string' && THEME_NAME_SET.has(value as ThemeName)
}

export function sanitizeTheme(value: unknown): ThemeName | null {
  if (typeof value !== 'string') return null
  if (isSupportedTheme(value)) return value
  return THEME_LEGACY_MAP[value] || null
}

export function isDarkTheme(theme: ThemeName): boolean {
  return DARK_THEME_SET.has(theme)
}

export function resolveDaisyTheme(theme: ThemeName): string {
  return theme === 'midnight' ? 'dark' : theme
}
