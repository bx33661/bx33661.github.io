import fs from "node:fs";
import path from "node:path";
import { banner, c, panel, section, statusLine, table } from "./lib/cli-ui.mjs";

const strict = process.argv.includes("--strict");

function readIfExists(relPath) {
  const fullPath = path.resolve(relPath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
}

function main() {
  const checks = [
    {
      area: "Site config",
      file: "src/config.ts",
      isDefault: /bx33661|www\.bx33661\.com|author:\s*"BX"/.test(readIfExists("src/config.ts")),
      hint: "Update SITE.website, title, author, email, defaultAuthorId, profile, friendCard",
    },
    {
      area: "Homepage bio",
      file: "src/components/AcademicHome.astro",
      isDefault: /Hey, I'm <span>bx\.<\/span>/.test(readIfExists("src/components/AcademicHome.astro")),
      hint: "Replace hero copy, intro bio, and focusTopics",
    },
    {
      area: "Custom domain",
      file: "public/CNAME",
      isDefault: readIfExists("public/CNAME").trim() === "www.bx33661.com",
      hint: "Update domain or remove public/CNAME if hosting on <user>.github.io",
    },
    {
      area: "Friends directory",
      file: "src/config/friends.ts",
      isDefault: /hnusec|bx33661/i.test(readIfExists("src/config/friends.ts")),
      hint: "Replace FRIEND_LINKS / HNUSEC_MEMBER_LINKS / ORGANIZATION_LINKS",
    },
    {
      area: "Series & academic data",
      file: "src/data/article-series.ts",
      isDefault: /redis-core-guide|chunqiu-Initial/.test(readIfExists("src/data/article-series.ts")),
      hint: "Curate your own series slugs in article-series.ts and src/data/academic/",
    },
  ];

  const defaultCount = checks.filter((item) => item.isDefault).length;
  console.log(banner("Template Audit", "Checking fork readiness for astro-orbit"));
  console.log(section("Customization Status"));
  console.log(
    table(
      checks.map((item) => [
        item.isDefault ? c.amber("! upstream default") : c.green("✓ customized"),
        c.bold(item.file),
        c.muted(item.hint),
      ]),
    ),
  );
  console.log("");

  if (defaultCount === 0) {
    console.log(
      panel("Template Customized", ["All primary identity and template configuration areas look customized."], "ok"),
    );
    return;
  }

  console.log(
    statusLine(
      strict ? "error" : "warn",
      `${defaultCount} / ${checks.length} template areas still hold upstream author defaults`,
      strict ? "Failing because --strict was specified" : "Informational mode; pass --strict to enforce in CI",
    ),
  );
  console.log(statusLine("next", "Checklist", "See README.md '用作博客模板 (astro-orbit)' for step-by-step setup"));
  console.log("");

  if (strict) process.exit(1);
}

main();
