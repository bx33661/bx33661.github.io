import fs from "node:fs";
import path from "node:path";
import { banner, c, panel, section, statusLine, table } from "./lib/cli-ui.mjs";

const strict = process.argv.includes("--strict");

function readIfExists(relPath) {
  const fullPath = path.resolve(relPath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
}

function main() {
  const config = readIfExists("src/config.ts");
  const projects = readIfExists("src/data/projects.ts");
  const friends = readIfExists("src/config/friends.ts");

  const checks = [
    {
      area: "Site origin & identity",
      file: "src/config.ts",
      isDefault: /astro-orbit\.example\.com|your-username|hello@example\.com|Orbit Author/.test(config),
      hint: "Run `npm run setup` or update SITE_ORIGIN, author, email, profile in src/config.ts",
    },
    {
      area: "Projects showcase",
      file: "src/data/projects.ts",
      isDefault: /your-username\/astro-orbit|astro-orbit\.example\.com/.test(projects),
      hint: "Replace demo PROJECTS entries or disable `features.projects` in src/config.ts",
    },
    {
      area: "Friends directory",
      file: "src/config/friends.ts",
      isDefault: /docs\.astro\.build|starlight\.astro\.build/.test(friends),
      hint: "Customize FRIEND_GROUPS in src/config/friends.ts or disable `features.friends`",
    },
  ];

  const defaultCount = checks.filter((item) => item.isDefault).length;
  console.log(banner("Template Audit", "Checking customization readiness for astro-orbit"));
  console.log(section("Customization Status"));
  console.log(
    table(
      checks.map((item) => [
        item.isDefault ? c.amber("! template default") : c.green("✓ customized"),
        c.bold(item.file),
        c.muted(item.hint),
      ]),
    ),
  );
  console.log("");

  if (defaultCount === 0) {
    console.log(
      panel("Template Customized", ["All primary identity and demo configuration areas look customized."], "ok"),
    );
    return;
  }

  console.log(
    statusLine(
      strict ? "error" : "warn",
      `${defaultCount} / ${checks.length} template areas still hold starter placeholders`,
      strict ? "Failing because --strict was specified" : "Informational mode; pass --strict to enforce in CI",
    ),
  );
  console.log(statusLine("next", "Quick setup", "Run `npm run setup` or edit src/config.ts"));
  console.log("");

  if (strict) process.exit(1);
}

main();
