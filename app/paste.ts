// QuoteRevive — Smart Paste parser (no-CSV-needed import).
//
// Pure, client-side, zero external calls. Turns whatever a contractor can
// copy — an Excel/Sheets block, comma lines, or free-form lines typed from
// a notebook — into candidate quote rows plus an honest list of the lines
// that could not be read. Self-contained on purpose (mirrors the email and
// date rules of lib.ts) so it can be unit-tested exactly like lib/cloud.

export interface PastedQuoteRow {
  name: string;
  email: string;
  amount: number;
  jobType: string;
  date?: string; // yyyy-mm-dd, only when a date was found on the line
}

export interface PastedProblem {
  line: number; // 1-based line number in the pasted text
  text: string; // the original line, trimmed
  reason: string;
}

export interface PasteParseResult {
  rows: PastedQuoteRow[];
  problems: PastedProblem[];
}

type Field = "name" | "email" | "amount" | "date" | "jobType";

// Same header vocabulary as the CSV importer in lib.ts.
const HEADER_ALIASES: Record<Field, string[]> = {
  name: ["name", "customer", "customer name", "client", "client name", "full name", "contact"],
  email: ["email", "email address", "e-mail", "customer email", "client email"],
  amount: ["amount", "quote amount", "value", "quote value", "price", "total", "estimate", "quote"],
  date: ["date", "quote date", "quoted date", "sent date", "created"],
  jobType: ["job type", "job", "service", "project", "work type", "description", "job description"],
};

const ALL_ALIAS_WORDS = new Set(Object.values(HEADER_ALIASES).flat());
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const DATE_ISO_RE = /\b\d{4}-\d{2}-\d{2}\b/;
const DATE_US_RE = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/;
const MONEY_RE = /\$?\d[\d,]*(?:\.\d{1,2})?/g;

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
}

/** Same date rules as lib.normalizeDate: ISO passes through, MM/DD/YYYY converts. */
function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  const d = new Date(t);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }
  return null;
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  const n = parseFloat(raw.replace(/[$,]/g, ""));
  return isNaN(n) ? null : n;
}

/** Quote-aware CSV scanner (same behaviour as lib.parseCSV) for comma blocks. */
function parseDelimitedText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Map header cells to fields; needs at least 2 recognised columns. */
function matchHeader(cells: string[]): Partial<Record<Field, number>> | null {
  const norm = cells.map((c) => c.trim().toLowerCase());
  const map: Partial<Record<Field, number>> = {};
  (Object.keys(HEADER_ALIASES) as Field[]).forEach((field) => {
    const idx = norm.findIndex((h) => HEADER_ALIASES[field].includes(h));
    if (idx >= 0) map[field] = idx;
  });
  return Object.keys(map).length >= 2 ? map : null;
}

function finishRow(
  out: PasteParseResult,
  lineNo: number,
  lineText: string,
  name: string,
  email: string,
  amount: number | null,
  jobType: string,
  date?: string
) {
  if (!name) { out.problems.push({ line: lineNo, text: lineText, reason: "No name found on this line" }); return; }
  if (!email) { out.problems.push({ line: lineNo, text: lineText, reason: "No email found on this line" }); return; }
  if (!isValidEmail(email)) { out.problems.push({ line: lineNo, text: lineText, reason: `That email does not look right: ${email}` }); return; }
  if (amount === null) { out.problems.push({ line: lineNo, text: lineText, reason: "No amount found on this line" }); return; }
  out.rows.push({ name, email, amount, jobType, ...(date ? { date } : {}) });
}

/** Header-led block (Excel TSV paste or CSV-with-header pasted as text). */
function parseStructured(lines: string[], headerIdx: number, delim: "\t" | ",", map: Partial<Record<Field, number>>): PasteParseResult {
  const out: PasteParseResult = { rows: [], problems: [] };
  const dataText = lines.slice(headerIdx + 1).join("\n");
  const table: string[][] = delim === "\t"
    ? dataText.split("\n").map((l) => l.split("\t"))
    : parseDelimitedText(dataText);
  table.forEach((cells, i) => {
    if (!cells.some((c) => c.trim() !== "")) return;
    const lineNo = headerIdx + 2 + i;
    const get = (f: Field) => (map[f] !== undefined ? (cells[map[f]!] || "").trim() : "");
    const amountRaw = get("amount");
    finishRow(
      out, lineNo, cells.join(delim === "\t" ? "  " : ", "),
      get("name"), get("email"),
      amountRaw === "" ? null : parseAmount(amountRaw),
      get("jobType"),
      normalizeDate(get("date")) || undefined
    );
  });
  return out;
}

/** One free-form line: pull out email, date and amount, split the rest. */
function parseFreeformLine(out: PasteParseResult, lineNo: number, rawLine: string) {
  const lineText = rawLine.trim();
  let work = rawLine;

  // 1. Email — find it anywhere, then take it out.
  let email = "";
  const em = work.match(EMAIL_RE);
  if (em) { email = em[0]; work = work.replace(em[0], " "); }

  // 2. Date — ISO or US format, taken out so its numbers are not read as money.
  let date: string | undefined;
  const dm = work.match(DATE_ISO_RE) || work.match(DATE_US_RE);
  if (dm) { date = normalizeDate(dm[0]) || undefined; work = work.replace(dm[0], " "); }

  // 3. Amount — the largest plausible money number left on the line.
  let amount: number | null = null;
  let amountText = "";
  let amountIndex = -1;
  for (const m of work.matchAll(MONEY_RE)) {
    const v = parseAmount(m[0]);
    if (v === null || v < 1 || v > 100000000) continue;
    if (amount === null || v > amount) { amount = v; amountText = m[0]; amountIndex = m.index; }
  }
  if (amountIndex >= 0) work = work.slice(0, amountIndex) + " " + work.slice(amountIndex + amountText.length);

  // 4. Whatever is left splits into name (first chunk) + job type (the rest).
  const chunks = work
    .split(/\s*[—–]\s*|\s+-\s+|[,;|]|\t+|\s{2,}/)
    .map((c) => c.replace(/^[\s,;|—–-]+|[\s,;|—–-]+$/g, "").trim())
    .filter(Boolean);
  const name = chunks[0] || "";
  const jobType = chunks.slice(1).join(" ").replace(/\s+/g, " ").trim();

  if (email && !isValidEmail(email)) {
    out.problems.push({ line: lineNo, text: lineText, reason: `That email does not look right: ${email}` });
    return;
  }
  finishRow(out, lineNo, lineText, name, email, amount, jobType, date);
}

export function parsePastedQuotes(text: string): PasteParseResult {
  const out: PasteParseResult = { rows: [], problems: [] };
  if (!text || !text.trim()) return out;
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const firstIdx = lines.findIndex((l) => l.trim() !== "");
  if (firstIdx === -1) return out;
  const first = lines[firstIdx];

  // Header-led block? (tab or comma separated, first line names the columns)
  const delim = first.includes("\t") ? "\t" : first.includes(",") ? "," : null;
  if (delim && !EMAIL_RE.test(first)) {
    const map = matchHeader(first.split(delim));
    if (map) return parseStructured(lines, firstIdx, delim, map);
  }

  // Otherwise read it line by line, tolerantly.
  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    // A delimiter-free header line ("Name Email Amount Job") is skipped, not an error.
    if (i === firstIdx && !EMAIL_RE.test(raw)) {
      const words = raw.toLowerCase().split(/[\s,;|]+/).filter(Boolean);
      if (words.filter((w) => ALL_ALIAS_WORDS.has(w)).length >= 3) return;
    }
    parseFreeformLine(out, i + 1, raw);
  });
  return out;
}
