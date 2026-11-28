import { readStorage, writeStorage } from "./browser-storage.ts";

export type Theme = "light" | "dark";
export type ThemeDefault = "system" | Theme;
const parseTheme = (value: string | null): Theme | null => (value === "light" || value === "dark" ? value : null);

/** One preference owner; failed persistence retains the choice for this visit. */
export function createThemePreference(
  storage: () => Pick<Storage, "getItem" | "setItem">,
  systemDark: () => boolean,
  defaultMode: ThemeDefault = "system",
) {
  let choice = parseTheme(readStorage(storage, "theme"));
  let volatile = false;
  const sync = () => {
    choice = parseTheme(readStorage(storage, "theme", choice));
    volatile = false;
  };
  return {
    get(): Theme {
      if (!volatile) sync();
      if (choice) return choice;
      if (defaultMode === "light" || defaultMode === "dark") return defaultMode;
      return systemDark() ? "dark" : "light";
    },
    select(theme: Theme) {
      choice = theme;
      volatile = !writeStorage(storage, "theme", theme);
    },
    sync,
  };
}
