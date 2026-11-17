// QuoteRevive — cloud mapping + sync helpers (Phase 2).
//
// Pure row-mapping functions live at the top (unit-tested in
// tests/cloud.test.mjs); the two async functions at the bottom talk to
// Supabase through a structural client interface so this module never
// imports the Supabase SDK itself. All imports from ./lib are type-only.
import type { AppState, Quote, Template, Touch, ReplyStatus, QuoteStatus } from "./lib";

/* ---------------- DB row shapes (mirror supabase/schema.sql) ---------------- */

export interface ProfileRow {
  id: string;
  business_name: string;
  owner_name: string;
  trade: string;
  reply_to_email: string;
  booking_link: string;
  trial_start: string; // ISO timestamptz
  created_at?: string;
}

export interface QuoteRow {
  id: string;
  user_id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  job_type: string;
  amount: number;
  quote_date: string | null; // yyyy-mm-dd
  status: string;
  created_at?: string;
}

export interface CampaignRow {
  id: string;
  user_id: string;
  name: string;
  templates: Template[];
  launched_at?: string;
}

export interface TouchRow {
  id: string;
  campaign_id: string;
  quote_id: string;
  user_id: string;
  touch_index: number;
  due_date: string; // yyyy-mm-dd
  status: string;
  sent_at: string | null; // ISO timestamptz
}

export interface ReplyRow {
  id?: string;
  quote_id: string;
  user_id: string;
  status: string;
  note: string | null;
  updated_at?: string;
}

export interface CloudRows {
  profile: ProfileRow | null;
  quotes: QuoteRow[];
  campaign: CampaignRow | null;
  touches: TouchRow[];
  replies: ReplyRow[];
}

/* ---------------- ids ---------------- */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export function newUuid(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // Fallback (very old runtimes): RFC-4122-shaped random id.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * The DB id columns are uuid, but local/testing ids are short strings
 * ("sample-1", uid() output, "demo-t-…"). Before the first cloud save,
 * rewrite every non-uuid quote/touch id to a fresh uuid — consistently,
 * so touches keep pointing at their quote. Returns the (possibly new)
 * state plus the old→new quote-id map (for remapping the reply log).
 * Ids that are already uuids are left untouched.
 */
export function normalizeStateIds(
  state: AppState,
  gen: () => string = newUuid
): { state: AppState; quoteIdMap: Map<string, string> } {
  const quoteIdMap = new Map<string, string>();
  let changed = false;
  const quotes = state.quotes.map((q) => {
    if (isUuid(q.id)) return q;
    const nid = gen();
    quoteIdMap.set(q.id, nid);
    changed = true;
    return { ...q, id: nid };
  });
  const touches = state.touches.map((t) => {
    let nt = t;
    if (quoteIdMap.has(t.quoteId)) nt = { ...nt, quoteId: quoteIdMap.get(t.quoteId) as string };
    if (!isUuid(nt.id)) {
      nt = { ...nt, id: gen() };
      changed = true;
    }
    return nt;
  });
  if (!changed) return { state, quoteIdMap };
  return { state: { ...state, quotes, touches }, quoteIdMap };
}

export function stateNeedsIdNormalization(state: AppState): boolean {
  return (
    state.quotes.some((q) => !isUuid(q.id)) || state.touches.some((t) => !isUuid(t.id))
  );
}

/* ---------------- state -> rows ---------------- */

export function profileToRow(state: AppState, userId: string): ProfileRow {
  return {
    id: userId,
    business_name: state.profile.businessName,
    owner_name: state.profile.ownerName,
    trade: state.profile.trade,
    reply_to_email: state.profile.replyEmail,
    booking_link: state.profile.bookingLink,
    trial_start: state.account.createdAt,
  };
}

export function quoteToRow(q: Quote, userId: string): QuoteRow {
  return {
    id: q.id,
    user_id: userId,
    customer_name: q.name,
    email: q.email,
    phone: null,
    job_type: q.jobType,
    amount: q.amount,
    quote_date: q.date || null,
    status: q.status,
  };
}

export function campaignToRow(state: AppState, userId: string, campaignId: string): CampaignRow {
  return {
    id: campaignId,
    user_id: userId,
    name: "Quote follow-up",
    templates: state.templates,
  };
}

export function touchToRow(t: Touch, userId: string, campaignId: string): TouchRow {
  return {
    id: t.id,
    campaign_id: campaignId,
    quote_id: t.quoteId,
    user_id: userId,
    touch_index: t.touchIndex,
    due_date: t.dueDate,
    status: t.status,
    sent_at: t.sentAt ? new Date(t.sentAt + "T00:00:00").toISOString() : null,
  };
}

/** One replies row per quote that has a reply status on the board. */
export function replyRowsFor(state: AppState, userId: string): ReplyRow[] {
  return state.quotes
    .filter((q) => q.reply !== "")
    .map((q) => ({
      quote_id: q.id,
      user_id: userId,
      status: q.reply,
      note: null,
    }));
}

/* ---------------- rows -> state ---------------- */

export function rowToQuote(row: QuoteRow, reply: ReplyStatus): Quote {
  return {
    id: row.id,
    name: row.customer_name,
    email: row.email,
    amount: Number(row.amount) || 0,
    date: row.quote_date || "",
    jobType: row.job_type || "",
    status: (row.status || "New") as QuoteStatus,
    reply,
  };
}

export function rowToTouch(row: TouchRow): Touch {
  const t: Touch = {
    id: row.id,
    quoteId: row.quote_id,
    touchIndex: row.touch_index,
    dayOffset: [0, 3, 10, 25][row.touch_index] ?? 0,
    dueDate: row.due_date,
    status: (row.status || "pending") as Touch["status"],
  };
  if (row.sent_at) {
    const d = new Date(row.sent_at);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      t.sentAt = `${y}-${m}-${day}`;
    }
  }
  return t;
}

function validTemplates(raw: unknown): Template[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const ok = raw.every(
    (t) =>
      t && typeof t === "object" &&
      typeof (t as Template).subject === "string" &&
      typeof (t as Template).body === "string" &&
      typeof (t as Template).day === "number"
  );
  return ok ? (raw as Template[]) : null;
}

/**
 * Build an AppState from cloud rows. The auth user's email is supplied by
 * the caller (it lives in auth, not in profiles). The password is never
 * stored in the cloud state — it stays with Supabase Auth. The trial clock
 * is the profile's trial_start.
 */
export function rowsToState(rows: CloudRows, email: string, fallbackTemplates: Template[]): AppState {
  const p = rows.profile;
  const replyByQuote = new Map<string, ReplyStatus>();
  for (const r of rows.replies) replyByQuote.set(r.quote_id, (r.status || "") as ReplyStatus);
  const templates = validTemplates(rows.campaign?.templates) ?? fallbackTemplates;
  return {
    account: {
      name: p?.owner_name || "",
      businessName: p?.business_name || "",
      trade: p?.trade || "",
      email,
      password: "",
      createdAt: p?.trial_start || new Date().toISOString(),
    },
    profile: {
      businessName: p?.business_name || "",
      ownerName: p?.owner_name || "",
      replyEmail: p?.reply_to_email || email,
      bookingLink: p?.booking_link || "",
      trade: p?.trade || "",
    },
    quotes: rows.quotes.map((r) => rowToQuote(r, replyByQuote.get(r.id) ?? "")),
    templates,
    touches: rows.touches.map(rowToTouch),
  };
}

/* ---------------- async sync (structural client, no SDK import) ---------------- */

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

// The Supabase client's query builders are thenable; typing them loosely
// here keeps this module SDK-free. Runtime behaviour is the real client's.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CloudClient = any;

function unwrap<T>(res: QueryResult<T>, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

export async function loadCloudRows(sb: CloudClient, userId: string): Promise<CloudRows> {
  const [profileRes, quotesRes, campaignsRes, touchesRes, repliesRes] = await Promise.all([
    sb.from("profiles").select("*").eq("id", userId),
    sb.from("quotes").select("*").eq("user_id", userId),
    sb.from("campaigns").select("*").eq("user_id", userId).order("launched_at", { ascending: true }),
    sb.from("touches").select("*").eq("user_id", userId),
    sb.from("replies").select("*").eq("user_id", userId),
  ]);
  const profiles = unwrap<ProfileRow[]>(profileRes, "load profile");
  const campaigns = unwrap<CampaignRow[]>(campaignsRes, "load campaigns");
  return {
    profile: profiles[0] ?? null,
    quotes: unwrap<QuoteRow[]>(quotesRes, "load quotes") ?? [],
    campaign: campaigns[0] ?? null,
    touches: unwrap<TouchRow[]>(touchesRes, "load touches") ?? [],
    replies: unwrap<ReplyRow[]>(repliesRes, "load replies") ?? [],
  };
}

/**
 * Replace-all persistence for one user. Deletes run children-first
 * (touches/replies before quotes) and inserts run parents-first
 * (profile upsert, quotes, campaign upsert, touches, replies) so every
 * foreign key is satisfied at each step. The user's single campaign row
 * is kept across syncs (its id is reused) so touches can reference it.
 * Throws on the first failed step; the caller keeps local state and
 * surfaces a non-blocking sync note — user data is never discarded.
 */
export async function syncStateToCloud(sb: CloudClient, userId: string, state: AppState): Promise<void> {
  unwrap(
    await sb.from("profiles").upsert(profileToRow(state, userId), { onConflict: "id" }),
    "save profile"
  );

  const existing = unwrap<CampaignRow[]>(
    await sb.from("campaigns").select("id").eq("user_id", userId).order("launched_at", { ascending: true }).limit(1),
    "load campaign"
  );
  const campaignId = existing[0]?.id ?? newUuid();
  unwrap(
    await sb.from("campaigns").upsert(campaignToRow(state, userId, campaignId), { onConflict: "id" }),
    "save campaign"
  );

  unwrap(await sb.from("touches").delete().eq("user_id", userId), "clear touches");
  unwrap(await sb.from("replies").delete().eq("user_id", userId), "clear replies");
  unwrap(await sb.from("quotes").delete().eq("user_id", userId), "clear quotes");

  const quoteRows = state.quotes.map((q) => quoteToRow(q, userId));
  if (quoteRows.length > 0) {
    unwrap(await sb.from("quotes").insert(quoteRows), "save quotes");
  }
  const touchRows = state.touches.map((t) => touchToRow(t, userId, campaignId));
  if (touchRows.length > 0) {
    unwrap(await sb.from("touches").insert(touchRows), "save touches");
  }
  const replyRows = replyRowsFor(state, userId);
  if (replyRows.length > 0) {
    unwrap(await sb.from("replies").insert(replyRows), "save replies");
  }
}
