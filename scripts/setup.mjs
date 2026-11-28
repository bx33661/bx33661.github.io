import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { banner, c, panel, statusLine, table } from "./lib/cli-ui.mjs";

const VALID_PRESETS = new Set(["cobalt", "emerald", "amber", "violet", "rose", "slate"]);
const VALID_MODES = new Set(["system", "light", "dark"]);

function replaceTopConst(source, key, valueLiteral) {
  return source.replace(new RegExp(`(^const ${key}(?::[^=]+)?\\s*=\\s*)([^;]+)(;)`, "m"), `$1${valueLiteral}$3`);
}

function replaceSiteProp(source, key, valueLiteral) {
  return source.replace(new RegExp(`(^\\s*${key}:\\s*)(["'][^"']*["'])(,)`, "m"), `$1${valueLiteral}$3`);
}

function replaceFeatureFlag(source, key, enabled) {
  return source.replace(new RegExp(`(^\\s*${key}:\\s*)(?:true|false)(,)`, "m"), `$1${enabled}$2`);
}

function normalizeBaseInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "/") return "/";
  const withLead = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLead.endsWith("/") ? withLead : `${withLead}/`;
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(banner("Astro Orbit Setup", "Interactive template customization wizard"));
    console.log("");

    const ask = async (label, fallback = "") => {
      const hint = fallback ? ` ${c.muted(`(${fallback})`)}` : "";
      const answer = (await rl.question(`  ${c.cyan("?")} ${c.bold(label)}${hint}: `)).trim();
      return answer || fallback;
    };

    const askBool = async (label, defaultYes = true) => {
      const hint = defaultYes ? "Y/n" : "y/N";
      const answer = (await ask(`${label} [${hint}]`, defaultYes ? "y" : "n")).toLowerCase();
      return defaultYes ? answer !== "n" && answer !== "no" : answer === "y" || answer === "yes";
    };

    const title = await ask("Site Title", "My Orbit Blog");
    const author = await ask("Author Display Name", "Your Name");
    const authorId = await ask("Default Author ID (slug)", author.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "author");
    const origin = (await ask("Site Origin URL (no trailing slash)", "https://example.github.io")).replace(/\/+$/, "");
    const base = normalizeBaseInput(await ask("Base Path (/ for root, or /repo/)", "/"));
    const githubUser = await ask("GitHub Username", "your-username");
    const email = await ask("Contact Email", "hello@example.com");
    const defaultLocaleRaw = (await ask("Default Language [en / zh-CN]", "en")).toLowerCase();
    const defaultLocale = defaultLocaleRaw === "zh-cn" || defaultLocaleRaw === "zh" ? "zh-CN" : "en";
    const bilingual = await askBool("Enable Bilingual Mode?", true);

    const presetRaw = (await ask("Accent Theme [cobalt / emerald / amber / violet / rose / slate]", "cobalt")).toLowerCase();
    const themePreset = VALID_PRESETS.has(presetRaw) ? presetRaw : "cobalt";
    const modeRaw = (await ask("Default Color Mode [system / light / dark]", "system")).toLowerCase();
    const themeMode = VALID_MODES.has(modeRaw) ? modeRaw : "system";

    const enableNotes = await askBool("Enable Notes section?", true);
    const enableProjects = await askBool("Enable Projects section?", true);
    const enableFriends = await askBool("Enable Friends directory?", true);
    const enableGalleries = await askBool("Enable Photo Galleries?", true);

    const configPath = path.resolve("src/config.ts");
    let config = fs.readFileSync(configPath, "utf8");

    config = replaceTopConst(config, "SITE_ORIGIN", JSON.stringify(origin));
    config = replaceTopConst(config, "SITE_BASE", JSON.stringify(base));
    config = replaceTopConst(config, "SITE_PROFILE", JSON.stringify(`https://github.com/${githubUser}`));
    config = replaceTopConst(config, "SITE_EMAIL", JSON.stringify(email));
    config = replaceTopConst(config, "DEFAULT_LOCALE", JSON.stringify(defaultLocale));
    config = replaceTopConst(config, "BILINGUAL", String(bilingual));
    config = replaceTopConst(config, "THEME_PRESET", JSON.stringify(themePreset));
    config = replaceTopConst(config, "THEME_DEFAULT_MODE", JSON.stringify(themeMode));

    config = replaceFeatureFlag(config, "notes", enableNotes);
    config = replaceFeatureFlag(config, "projects", enableProjects);
    config = replaceFeatureFlag(config, "friends", enableFriends);
    config = replaceFeatureFlag(config, "galleries", enableGalleries);

    config = replaceSiteProp(config, "title", JSON.stringify(title));
    config = replaceSiteProp(config, "author", JSON.stringify(author));
    config = replaceSiteProp(config, "defaultAuthorId", JSON.stringify(authorId));

    config = config.replace(
      /(editPost:\s*\{[\s\S]*?url:\s*)["'][^"']*["']/,
      `$1${JSON.stringify(`https://github.com/${githubUser}/astro-orbit/edit/main/`)}`,
    );
    config = config.replace(
      /(friendCard:\s*\{[\s\S]*?name:\s*)["'][^"']*["']/,
      `$1${JSON.stringify(title)}`,
    );

    fs.writeFileSync(configPath, config, "utf8");

    console.log("");
    console.log(
      panel(
        "Configuration Updated",
        [
          `File       src/config.ts`,
          `Site       ${origin}${base}`,
          `Author     ${author} (@${githubUser})`,
          `Languages  default=${defaultLocale}, bilingual=${bilingual}`,
          `Theme      preset=${themePreset}, defaultMode=${themeMode}`,
          `Modules    notes=${enableNotes}, projects=${enableProjects}, friends=${enableFriends}, galleries=${enableGalleries}`,
        ],
        "ok",
      ),
    );
    console.log("");
    console.log(
      table([
        [c.cyan("Clean"), "Run npm run clean:demo to remove starter demo posts & galleries"],
        [c.cyan("Copy"), "Customize homepage copy in src/config.ts (`SITE.home`)"],
        [c.cyan("Check"), "Run npm run template:check && npm run verify:quick"],
        [c.cyan("Preview"), "Run npm run dev to start the local server"],
      ]),
    );
    console.log("");
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(statusLine("error", "Setup failed", error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
