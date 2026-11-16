// QuoteRevive core logic — pure functions, unit-tested separately.
export type QuoteStatus = "New" | "In sequence" | "Replied" | "Booked" | "Dead";
export type ReplyStatus = "" | "New" | "Interested" | "Not now" | "Booked";
export type TouchStatus = "pending" | "sent" | "cancelled";

export interface Quote {
  id: string;
  name: string;
  email: string;
  amount: number;
  date: string; // yyyy-mm-dd quote date
  jobType: string;
  status: QuoteStatus;
  reply: ReplyStatus;
}

export interface Template {
  day: number;
  subject: string;
  body: string;
}

export interface Touch {
  id: string;
  quoteId: string;
  touchIndex: number; // 0..3
  dayOffset: number;
  dueDate: string; // yyyy-mm-dd
  status: TouchStatus;
  sentAt?: string;
}

export interface Profile {
  businessName: string;
  ownerName: string;
  replyEmail: string;
  bookingLink: string;
  trade: string;
}

export interface Account {
  name: string;
  businessName: string;
  trade: string;
  email: string;
  password: string;
  createdAt: string; // ISO
}

export interface AppState {
  account: Account;
  profile: Profile;
  quotes: Quote[];
  templates: Template[];
  touches: Touch[];
}

export const TOUCH_DAYS = [0, 3, 10, 25];
export const TRIAL_DAYS = 30;

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function todayISO(): string {
  const d = new Date();
  return toISODate(d);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function trialDaysRemaining(createdAtISO: string, now = new Date()): number {
  const start = new Date(createdAtISO);
  const elapsedMs = now.getTime() - start.getTime();
  const elapsedDays = Math.floor(elapsedMs / 86400000);
  return Math.max(0, TRIAL_DAYS - elapsedDays);
}

export function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function defaultTemplates(): Template[] {
  return [
    {
      day: 0,
      subject: "Quick follow-up on your {job_type} quote",
      body: "Hi {first_name},\n\nI'm {owner_name} from {business_name}. A while back we sent you a quote of {amount} for your {job_type} project, and I wanted to check whether it's still something you'd like to do.\n\nNo pressure at all — if the timing or budget changed, I completely understand. If you'd still like to go ahead, you can book a time that suits you here: {booking_link}\n\nThanks,\n{owner_name}\n{business_name}",
    },
    {
      day: 3,
      subject: "Still thinking about the {job_type}?",
      body: "Hi {first_name},\n\nJust a short follow-up on your {job_type} quote ({amount}) from {business_name}. Prices and availability can change, so I wanted to reach out while we can still honour this quote.\n\nWant me to keep your slot open, or should I close the file for now? Either answer is fine — just reply to this email.\n\nBest,\n{owner_name}",
    },
    {
      day: 10,
      subject: "Should I keep your {job_type} quote open, {first_name}?",
      body: "Hi {first_name},\n\nI don't want to keep bothering you, so this is a quick check-in about your {job_type} quote of {amount}.\n\nIf you'd like to move forward, booking is easy: {booking_link}\nIf now isn't the right time, just tell me and I'll check back another season.\n\nThanks for considering {business_name},\n{owner_name}",
    },
    {
      day: 25,
      subject: "Closing your {job_type} quote file",
      body: "Hi {first_name},\n\nI'm tidying up old quotes this week, and your {job_type} quote ({amount}) from {business_name} is on the list. Before I close it, I wanted to give you one last chance to keep it.\n\nReply to this email or book here: {booking_link} — and if I don't hear back, no hard feelings at all.\n\nAll the best,\n{owner_name}\n{business_name}",
    },
  ];
}

export function sampleQuotes(): Quote[] {
  const rows: Array<[string, string, number, string, string]> = [
    ["James Miller", "james.miller@example.com", 8400, "2026-08-14", "Kitchen remodel"],
    ["Sarah Thompson", "sarah.t@example.com", 3200, "2026-08-28", "Bathroom tiling"],
    ["David Garcia", "david.garcia@example.com", 12500, "2026-09-03", "Roof replacement"],
    ["Emily Wilson", "emily.w@example.com", 1850, "2026-09-11", "Exterior painting"],
    ["Michael Brown", "mbrown@example.com", 5600, "2026-09-19", "AC replacement"],
    ["Jessica Davis", "jess.davis@example.com", 9750, "2026-09-26", "Basement finishing"],
    ["Robert Johnson", "rjohnson@example.com", 4300, "2026-10-02", "Fence & deck repair"],
    ["Amanda Lee", "amanda.lee@example.com", 2600, "2026-10-09", "Interior painting"],
    ["Chris Walker", "chris.walker@example.com", 15200, "2026-10-15", "Full home renovation"],
    ["Laura Hall", "laura.hall@example.com", 3900, "2026-10-21", "Landscaping & patio"],
    ["Kevin Young", "kevin.young@example.com", 6100, "2026-10-28", "Heating system install"],
    ["Rachel King", "rachel.king@example.com", 7200, "2026-11-04", "Garage conversion"],
  ];
  return rows.map((r, i) => ({
    id: "sample-" + (i + 1),
    name: r[0],
    email: r[1],
    amount: r[2],
    date: r[3],
    jobType: r[4],
    status: "New" as QuoteStatus,
    reply: "" as ReplyStatus,
  }));
}

export function renderTemplate(text: string, quote: Quote, profile: Profile): string {
  const first = quote.name.trim().split(/\s+/)[0] || "there";
  return text
    .replaceAll("{first_name}", first)
    .replaceAll("{business_name}", profile.businessName || "our team")
    .replaceAll("{job_type}", quote.jobType || "project")
    .replaceAll("{amount}", money(quote.amount))
    .replaceAll("{owner_name}", profile.ownerName || "")
    .replaceAll("{booking_link}", profile.bookingLink || "(add your booking link in Settings)");
}

export function gmailComposeUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
  return "https://mail.google.com/mail/?" + params.toString();
}

// ---- CSV parsing ----
export function parseCSV(text: string): string[][] {
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

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "customer", "customer name", "client", "client name", "full name", "contact"],
  email: ["email", "email address", "e-mail", "customer email", "client email"],
  amount: ["amount", "quote amount", "value", "quote value", "price", "total", "estimate", "quote"],
  date: ["date", "quote date", "quoted date", "sent date", "created"],
  jobType: ["job type", "job", "service", "project", "work type", "description", "job description"],
};

export interface ImportReport {
  added: Quote[];
  duplicates: number;
  badRows: Array<{ row: number; reason: string }>;
  totalRows: number;
}

export function validEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
}

export function importQuotesFromCSV(text: string, existing: Quote[]): ImportReport {
  const rows = parseCSV(text);
  const report: ImportReport = { added: [], duplicates: 0, badRows: [], totalRows: 0 };
  if (rows.length < 2) return report;
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col: Record<string, number> = {};
  for (const key of Object.keys(HEADER_ALIASES)) {
    col[key] = header.findIndex((h) => HEADER_ALIASES[key].includes(h));
  }
  if (col.name === -1 || col.email === -1) {
    report.badRows.push({ row: 1, reason: "Header must include a name column and an email column." });
    return report;
  }
  const seen = new Set(existing.map((q) => q.email.toLowerCase()));
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    report.totalRows++;
    const get = (k: string) => (col[k] >= 0 ? (r[col[k]] || "").trim() : "");
    const name = get("name");
    const email = get("email");
    const amountRaw = get("amount").replace(/[$,]/g, "");
    const amount = amountRaw ? parseFloat(amountRaw) : 0;
    const dateRaw = get("date");
    const date = normalizeDate(dateRaw) || todayISO();
    const jobType = get("jobType") || "Project";
    if (!name) { report.badRows.push({ row: i + 1, reason: "Missing name" }); continue; }
    if (!validEmail(email)) { report.badRows.push({ row: i + 1, reason: `Invalid email: ${email || "(blank)"}` }); continue; }
    if (seen.has(email.toLowerCase())) { report.duplicates++; continue; }
    seen.add(email.toLowerCase());
    report.added.push({
      id: uid() + "-" + i,
      name, email, amount: isNaN(amount) ? 0 : amount, date, jobType,
      status: "New", reply: "",
    });
  }
  return report;
}

export function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    // Assume MM/DD/YYYY (US format used by Jobber/QuickBooks exports)
    const mm = m[1].padStart(2, "0"), dd = m[2].padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  const d = new Date(t);
  if (!isNaN(d.getTime())) return toISODate(d);
  return null;
}

export const SAMPLE_CSV = `name,email,amount,quote date,job type
James Miller,james.miller@example.com,8400,2026-08-14,Kitchen remodel
Sarah Thompson,sarah.t@example.com,3200,2026-08-28,Bathroom tiling
David Garcia,david.garcia@example.com,12500,2026-09-03,Roof replacement
`;

// ---- Campaign / sequence engine ----
export function launchCampaign(quotes: Quote[], touches: Touch[], startDate: string): { quotes: Quote[]; touches: Touch[]; launched: number } {
  const newTouches: Touch[] = [...touches];
  let launched = 0;
  const updatedQuotes = quotes.map((q) => {
    if (q.status !== "New") return q;
    const already = newTouches.some((t) => t.quoteId === q.id && t.status !== "cancelled");
    if (already) return q;
    TOUCH_DAYS.forEach((offset, idx) => {
      newTouches.push({
        id: uid() + "-t" + idx + "-" + q.id,
        quoteId: q.id,
        touchIndex: idx,
        dayOffset: offset,
        dueDate: addDays(startDate, offset),
        status: "pending",
      });
    });
    launched++;
    return { ...q, status: "In sequence" as QuoteStatus };
  });
  return { quotes: updatedQuotes, touches: newTouches, launched };
}

/** Stop-on-reply: cancel all pending touches for a quote. */
export function cancelPendingTouches(touches: Touch[], quoteId: string): Touch[] {
  return touches.map((t) => (t.quoteId === quoteId && t.status === "pending" ? { ...t, status: "cancelled" as TouchStatus } : t));
}

export function markTouchSent(touches: Touch[], touchId: string, sentDate: string): Touch[] {
  return touches.map((t) => (t.id === touchId ? { ...t, status: "sent" as TouchStatus, sentAt: sentDate } : t));
}

export interface Stats {
  totalQuotes: number;
  idleValue: number;
  touchesSent: number;
  touchesPending: number;
  replies: number;
  booked: number;
  revivedValue: number;
}

// ---- Auth validation (pure helpers used by the sign-up / log-in forms) ----
export interface SignupInput {
  name: string;
  businessName: string;
  trade: string;
  email: string;
  password: string;
}

/** Returns an error message, or null when the sign-up input is acceptable.
    The testing build keeps ONE account on this device: signing up again with
    the same email as the saved account is rejected, so the existing quotes
    and campaign data are never silently overwritten by a fresh blank account. */
export function validateSignup(input: SignupInput, existing: Account | null): string | null {
  const name = input.name.trim();
  const businessName = input.businessName.trim();
  const email = input.email.trim();
  if (!name || !businessName || !email || input.password.length < 4) {
    return "Please fill in every field (password at least 4 characters).";
  }
  if (existing && existing.email.toLowerCase() === email.toLowerCase()) {
    return "An account with this email is already saved on this device. Log in instead — signing up again would wipe its quotes and campaigns.";
  }
  return null;
}

/** Returns an error message, or null when the credentials match the saved account. */
export function validateLogin(email: string, password: string, account: Account | null): string | null {
  if (!account) return "No account found on this device yet — please sign up first, or use the demo.";
  if (account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password) return null;
  return "Email or password does not match the account saved on this device.";
}

export function computeStats(quotes: Quote[], touches: Touch[]): Stats {
  const bookedQuotes = quotes.filter((q) => q.status === "Booked" || q.reply === "Booked");
  return {
    totalQuotes: quotes.length,
    idleValue: quotes.filter((q) => q.status !== "Booked" && q.status !== "Dead").reduce((s, q) => s + q.amount, 0),
    touchesSent: touches.filter((t) => t.status === "sent").length,
    touchesPending: touches.filter((t) => t.status === "pending").length,
    replies: quotes.filter((q) => q.reply !== "" || q.status === "Replied").length,
    booked: bookedQuotes.length,
    revivedValue: bookedQuotes.reduce((s, q) => s + q.amount, 0),
  };
}
