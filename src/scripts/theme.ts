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

  const label = themeValue === "dark" ? "切换到浅色模式" : "切换到深色模式";
  for (const button of document.querySelectorAll(
    "#theme-btn, #theme-btn-mobile",
  )) {
    button.setAttribute("aria-label", label);
  }

  // Get a reference to the body element
  const body = document.body;

  // Check if the body element exists before using getComputedStyle
  if (body) {
    // Get the computed styles for the body element
    const computedStyles = window.getComputedStyle(body);

    // Get the background color property
    const bgColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim() || computedStyles.backgroundColor;

    // Set the background color in <meta theme-color ... />
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bgColor);
  }
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

// Ensure theme is reflected (in case body wasn't ready when inline script ran)
reflectPreference();

let themeController: AbortController | null = null;

function setThemeFeature(): void {
  // set on load so screen readers can get the latest value on the button
  reflectPreference();

  // now this script can find and listen for clicks on the control
  const toggleTheme = (event: Event) => {
    finishThemeMotion();
    finishThemeReveal();
    const nextTheme = themeValue === "light" ? "dark" : "light";
    // Persist the intent before the snapshot callback; system changes must not
    // override an explicit choice during its brief preparation window.
    preference.select(nextTheme);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.dataset.themeChanging = "true";
      themeMotionTimer = window.setTimeout(finishThemeMotion, 300);
    }
    const revealing = revealTheme(event.currentTarget as HTMLElement, () => {
      // Another tab can choose a theme while the native snapshot prepares.
      // Read the newest intent; never persist an older captured choice again.
      themeValue = preference.get();
      window.theme?.setTheme(themeValue);
      reflectPreference();
    });
    if (revealing) {
      clearTimeout(themeMotionTimer);
      themeMotionTimer = window.setTimeout(finishThemeMotion, 650);
    }
  };

  const themeBtn = document.querySelector("#theme-btn");
  const themeBtnMobile = document.querySelector("#theme-btn-mobile");

  themeController?.abort();
  themeController = new AbortController();
  for (const button of [themeBtn, themeBtnMobile]) {
    button?.addEventListener("click", toggleTheme, {
      signal: themeController.signal,
    });
  }
}

// Set up theme features after page load
setThemeFeature();

// Runs on view transitions navigation
document.addEventListener("astro:after-swap", setThemeFeature);

// Set theme-color value before page transition
// to avoid navigation bar color flickering in Android dark mode
document.addEventListener("astro:before-swap", (event) => {
  finishThemeReveal();
  finishThemeMotion();
  const astroEvent = event;
  const bgColor = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");

  if (bgColor) {
    astroEvent.newDocument
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bgColor);
  }
});

// System preference only applies when no explicit choice exists.
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    themeValue = preference.get();
    reflectPreference();
  });

window.addEventListener("storage", (event) => {
  // clear() emits a null key; sessionStorage events must not affect this state.
  if (event.key !== "theme" && event.key !== null) return;
  try {
    if (event.storageArea !== null && event.storageArea !== localStorage)
      return;
  } catch {
    // A peer can emit an event even when this tab has denied storage access.
    return;
  }
  finishThemeReveal(false);
  finishThemeMotion();
  preference.sync();
  themeValue = preference.get();
  reflectPreference();
});
