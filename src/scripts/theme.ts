import { prefersReducedMotion } from "./reading-motion";
import { finishThemeReveal, revealTheme } from "./theme-motion";
import { createThemePreference, type Theme } from "../utils/theme-preference";

const preference = createThemePreference(
  () => localStorage,
  () => window.matchMedia("(prefers-color-scheme: dark)").matches,
);
let themeValue = preference.get();
let themeMotionTimer = 0;

const finishThemeMotion = () => {
  clearTimeout(themeMotionTimer);
  delete document.documentElement.dataset.themeChanging;
};

function setPreference(): void {
  preference.select(themeValue);
  reflectPreference();
}

function reflectPreference(): void {
  document.firstElementChild?.setAttribute("data-theme", themeValue);

  const isEnglish = document.documentElement.lang === "en";
  const label = isEnglish
    ? themeValue === "dark"
      ? "Switch to light theme"
      : "Switch to dark theme"
    : themeValue === "dark"
      ? "切换到浅色模式"
      : "切换到深色模式";
  for (const button of document.querySelectorAll("#theme-btn, #theme-btn-mobile")) {
    button.setAttribute("aria-label", label);
  }

  let bgColor = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  if (!bgColor && document.body) {
    bgColor = window.getComputedStyle(document.body).backgroundColor;
  }
  if (bgColor) {
    document.querySelector("meta[name='theme-color']")?.setAttribute("content", bgColor);
  }

  window.dispatchEvent(new CustomEvent("bx-theme-change", { detail: { theme: themeValue } }));
}

// The inline script only sets first-paint CSS. This module owns the live API.
window.theme = {
  get themeValue() {
    return themeValue;
  },
  setPreference,
  reflectPreference,
  getTheme: () => themeValue,
  setTheme: (value: Theme) => {
    themeValue = value;
  },
};

let themeController: AbortController | null = null;

function setThemeFeature(): void {
  reflectPreference();

  const toggleTheme = (event: Event) => {
    if (!(event.currentTarget instanceof HTMLElement)) return;
    finishThemeMotion();
    finishThemeReveal();
    const nextTheme = themeValue === "light" ? "dark" : "light";
    // Persist the intent before the snapshot callback; system changes must not
    // override an explicit choice during its brief preparation window.
    preference.select(nextTheme);
    if (!prefersReducedMotion()) {
      document.documentElement.dataset.themeChanging = "true";
      themeMotionTimer = window.setTimeout(finishThemeMotion, 300);
    }
    const revealing = revealTheme(event.currentTarget, () => {
      // Another tab can choose a theme while the native snapshot prepares.
      themeValue = preference.get();
      reflectPreference();
    });
    if (revealing) {
      clearTimeout(themeMotionTimer);
      themeMotionTimer = window.setTimeout(finishThemeMotion, 650);
    }
  };

  themeController?.abort();
  themeController = new AbortController();
  for (const button of document.querySelectorAll("#theme-btn, #theme-btn-mobile")) {
    button.addEventListener("click", toggleTheme, {
      signal: themeController.signal,
    });
  }
}

setThemeFeature();
document.addEventListener("astro:after-swap", setThemeFeature);

document.addEventListener("astro:before-swap", (event) => {
  themeController?.abort();
  themeController = null;
  finishThemeReveal();
  finishThemeMotion();
  event.newDocument.documentElement.setAttribute("data-theme", themeValue);
  const bgColor = document.querySelector("meta[name='theme-color']")?.getAttribute("content");
  if (bgColor) {
    event.newDocument.querySelector("meta[name='theme-color']")?.setAttribute("content", bgColor);
  }
});

// System preference only applies when no explicit choice exists.
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  themeValue = preference.get();
  reflectPreference();
});

window.addEventListener("storage", (event) => {
  if (event.key !== "theme" && event.key !== null) return;
  try {
    if (event.storageArea !== null && event.storageArea !== localStorage) return;
  } catch {
    return;
  }
  finishThemeReveal(false);
  finishThemeMotion();
  preference.sync();
  themeValue = preference.get();
  reflectPreference();
});
