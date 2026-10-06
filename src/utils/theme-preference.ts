import { readStorage, writeStorage } from "./browser-storage.ts";

export type Theme = "light" | "dark";
const parseTheme = (value: string | null): Theme | null =>
  value === "light" || value === "dark" ? value : null;

/** One preference owner; failed persistence retains the choice for this visit. */
export function createThemePreference(
  storage: () => Pick<Storage, "getItem" | "setItem">,
  systemDark: () => boolean,
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
      return choice ?? (systemDark() ? "dark" : "light");
    },
    select(theme: Theme) {
      choice = theme;
      volatile = !writeStorage(storage, "theme", theme);
    },
    sync,
  };
}
