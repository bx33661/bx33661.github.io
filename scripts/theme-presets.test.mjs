import assert from "node:assert/strict";
import { test } from "node:test";
import { createThemePreference } from "../src/utils/theme-preference.ts";
import { isValidHexColor, resolveThemeAccent, THEME_PRESETS, THEME_PRESET_NAMES } from "../src/utils/theme-presets.ts";

const memoryStore = () => {
  let value = null;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
  };
};

test("THEME_PRESETS exposes valid hex pairs for every preset", () => {
  assert.deepEqual(THEME_PRESET_NAMES, ["cobalt", "emerald", "amber", "violet", "rose", "slate"]);
  for (const name of THEME_PRESET_NAMES) {
    const preset = THEME_PRESETS[name];
    assert.equal(isValidHexColor(preset.light), true, `${name}.light`);
    assert.equal(isValidHexColor(preset.dark), true, `${name}.dark`);
    assert.deepEqual(resolveThemeAccent({ preset: name, accentLight: "", accentDark: "" }), {
      light: preset.light,
      dark: preset.dark,
      ogGlow: preset.ogGlow,
    });
  }
});

test("resolveThemeAccent applies valid hex overrides and ignores invalid strings", () => {
  const custom = resolveThemeAccent({ preset: "emerald", accentLight: "#123456", accentDark: "#ABCDEF" });
  assert.equal(custom.light, "#123456");
  assert.equal(custom.dark, "#ABCDEF");
  assert.equal(custom.ogGlow, THEME_PRESETS.emerald.ogGlow);

  const fallback = resolveThemeAccent({ preset: "violet", accentLight: "red", accentDark: "#123" });
  assert.equal(fallback.light, THEME_PRESETS.violet.light);
  assert.equal(fallback.dark, THEME_PRESETS.violet.dark);
});

test("createThemePreference respects explicit defaultMode when no user preference is stored", () => {
  const storageLight = memoryStore();
  const forceLight = createThemePreference(() => storageLight, () => true, "light");
  assert.equal(forceLight.get(), "light");
  forceLight.select("dark");
  assert.equal(forceLight.get(), "dark");

  const storageDark = memoryStore();
  const forceDark = createThemePreference(() => storageDark, () => false, "dark");
  assert.equal(forceDark.get(), "dark");
});
