#!/usr/bin/env node
/**
 * Refresh the GitHub contribution heatmap snapshot used by /projects/.
 * Requires an authenticated GitHub CLI (`gh auth login`). The build itself never
 * calls GitHub, so it stays offline-safe and immune to API rate limits.
 *
 * Usage: npm run github:contributions [-- <login>]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function resolveProfileLogin() {
  try {
    const config = fs.readFileSync(path.join(process.cwd(), "src/config.ts"), "utf8");
    const match = config.match(/profile:\s*["']https?:\/\/github\.com\/([^/"']+)["']/);
    return match?.[1] || "octocat";
  } catch {
    return "octocat";
  }
}

const login = process.argv[2] ?? resolveProfileLogin();
const output = path.join(process.cwd(), "src/data/github-contributions.json");
const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

const raw = execFileSync("gh", ["api", "graphql", "-f", `query=${query}`, "-F", `login=${login}`], {
  encoding: "utf8",
});
const calendar = JSON.parse(raw).data.user.contributionsCollection.contributionCalendar;
const days = calendar.weeks.flatMap((week) => week.contributionDays);

const snapshot = {
  login,
  generatedAt: new Date().toISOString().slice(0, 10),
  total: calendar.totalContributions,
  start: days[0].date,
  days: days.map((day) => [day.contributionCount, LEVELS[day.contributionLevel] ?? 0]),
};

fs.writeFileSync(output, `${JSON.stringify(snapshot)}\n`);
console.log(`Wrote ${days.length} days (${snapshot.total} contributions) to ${path.relative(process.cwd(), output)}`);
