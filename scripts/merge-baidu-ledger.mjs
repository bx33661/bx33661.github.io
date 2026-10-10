import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readNotificationState } from "./seo-notification-state.mjs";

// A pushed URL alone is not a receipt for the current version of its content.
export function mergeBaiduLedger(base, legacy, current) {
  const fingerprints = {};
  const sources = base.ledgerVersion === 1 ? [base] : [base, legacy];
  for (const [url, fingerprint] of Object.entries(current)) {
    if (sources.some((source) => source.fingerprints?.[url] === fingerprint)) {
      fingerprints[url] = fingerprint;
    }
  }
  return {
    ...base,
    ledgerVersion: 1,
    pushed: Object.keys(fingerprints),
    fingerprints,
  };
}

export async function migrateLedger(baseFile, ledgerFile, dist) {
  const base = JSON.parse(await fs.readFile(baseFile, "utf8"));
  let legacy = {};
  try {
    legacy = JSON.parse(await fs.readFile(ledgerFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const current = await readNotificationState(dist, "https://www.bx33661.com");
  const merged = mergeBaiduLedger(base, legacy, current);
  const temporary = ledgerFile + ".tmp";
  await fs.writeFile(temporary, JSON.stringify(merged, null, 2) + "\n");
  await fs.rename(temporary, ledgerFile);
  return {
    acknowledged: Object.keys(merged.fingerprints).length,
    queued:
      Object.keys(current).length - Object.keys(merged.fingerprints).length,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const [base, ledger, dist] = process.argv.slice(2);
  if (!base || !ledger || !dist) throw new Error("Expected base, ledger, dist");
  const result = await migrateLedger(base, ledger, dist);
  console.log(
    `[baidu-ledger] acknowledged=${result.acknowledged}, queued=${result.queued}`,
  );
}
