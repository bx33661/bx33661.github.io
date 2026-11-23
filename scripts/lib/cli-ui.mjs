const ANSI_PATTERN = /\x1B\[[0-9;]*[A-Za-z]/g;

export function supportsColor(stream = process.stdout) {
  if (process.env.NO_COLOR || process.env.TERM === "dumb") return false;
  if (process.env.FORCE_COLOR === "1") return true;
  return Boolean(stream?.isTTY);
}

export function stripAnsi(text) {
  return String(text ?? "").replace(ANSI_PATTERN, "");
}

function isZeroWidthCodePoint(cp) {
  return (
    cp < 0x20 ||
    cp === 0x7f ||
    cp === 0x200d ||
    (cp >= 0x0300 && cp <= 0x036f) ||
    (cp >= 0x1ab0 && cp <= 0x1aff) ||
    (cp >= 0x1dc0 && cp <= 0x1dff) ||
    (cp >= 0x20d0 && cp <= 0x20ff) ||
    (cp >= 0xfe00 && cp <= 0xfe0f) ||
    (cp >= 0xfe20 && cp <= 0xfe2f)
  );
}

function isWideCodePoint(cp) {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    cp === 0x2329 ||
    cp === 0x232a ||
    (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe10 && cp <= 0xfe19) ||
    (cp >= 0xfe30 && cp <= 0xfe6f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1f64f) ||
    (cp >= 0x1f900 && cp <= 0x1f9ff) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  );
}

export function displayWidth(text) {
  const clean = stripAnsi(text);
  let width = 0;
  for (const ch of clean) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isZeroWidthCodePoint(cp)) continue;
    width += isWideCodePoint(cp) ? 2 : 1;
  }
  return width;
}

function wrapAnsi(code, closeCode = "39") {
  return (text) => {
    const value = String(text ?? "");
    return supportsColor() ? `\x1B[${code}m${value}\x1B[${closeCode}m` : value;
  };
}

export const c = {
  bold: wrapAnsi("1", "22"),
  dim: wrapAnsi("2", "22"),
  brand: wrapAnsi("94"),
  cyan: wrapAnsi("36"),
  green: wrapAnsi("32"),
  amber: wrapAnsi("33"),
  red: wrapAnsi("31"),
  muted: wrapAnsi("90"),
};

function renderBox(rows, { border = c.dim, minWidth = 48 } = {}) {
  const innerWidth = Math.max(minWidth, ...rows.map((row) => displayWidth(row.raw)));
  const top = border(`╭${"─".repeat(innerWidth + 2)}╮`);
  const bottom = border(`╰${"─".repeat(innerWidth + 2)}╯`);
  const body = rows.map((row) => {
    const pad = " ".repeat(Math.max(0, innerWidth - displayWidth(row.raw)));
    const content = row.styled ?? row.raw;
    return `${border("│")} ${content}${pad} ${border("│")}`;
  });
  return [top, ...body, bottom].join("\n");
}

export function banner(title, subtitle = "") {
  const rawTitle = `✦ astro-orbit · ${title}`;
  const styledTitle = `${c.brand("✦ astro-orbit")} ${c.dim("·")} ${c.bold(title)}`;
  const rows = [{ raw: rawTitle, styled: styledTitle }];
  if (subtitle) {
    rows.push({ raw: subtitle, styled: c.muted(subtitle) });
  }
  return renderBox(rows, { border: c.dim, minWidth: 50 });
}

const TONE_META = {
  info: { glyph: "·", paint: c.brand, border: c.dim },
  ok: { glyph: "✓", paint: c.green, border: c.green },
  warn: { glyph: "!", paint: c.amber, border: c.amber },
  error: { glyph: "✗", paint: c.red, border: c.red },
  next: { glyph: "→", paint: c.cyan, border: c.dim },
};

export function panel(title, lines, tone = "info") {
  const meta = TONE_META[tone] ?? TONE_META.info;
  const rows = [
    { raw: `${meta.glyph} ${title}`, styled: `${meta.paint(meta.glyph)} ${c.bold(title)}` },
    ...lines.map((line) => ({
      raw: String(line),
      styled: String(line),
    })),
  ];
  return renderBox(rows, { border: meta.border, minWidth: 50 });
}

export function section(title) {
  return `\n${c.dim("──")} ${c.bold(title)}`;
}

export function statusLine(kind, label, detail = "") {
  const meta = TONE_META[kind] ?? TONE_META.info;
  const badge = meta.paint(meta.glyph);
  const title = c.bold(label);
  const tail = detail ? `  ${c.muted(detail)}` : "";
  return `  ${badge} ${title}${tail}`;
}

export function table(rows, { indent = 2, gap = 3 } = {}) {
  if (!rows.length) return "";
  const colCount = Math.max(...rows.map((row) => row.length));
  const widths = Array.from({ length: colCount }, (_, colIndex) =>
    Math.max(...rows.map((row) => displayWidth(row[colIndex] ?? ""))),
  );
  const prefix = " ".repeat(indent);
  const separator = " ".repeat(gap);
  return rows
    .map((row) => {
      const cells = row.map((cell, colIndex) => {
        const value = String(cell ?? "");
        if (colIndex === row.length - 1) return value;
        const pad = " ".repeat(Math.max(0, widths[colIndex] - displayWidth(value)));
        return `${value}${pad}`;
      });
      return `${prefix}${cells.join(separator)}`;
    })
    .join("\n");
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "0ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
