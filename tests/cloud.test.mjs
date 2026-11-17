// Cloud suite — pure row-mapping helpers in app/cloud.ts (Phase 2).
// Runs against the compiled cloud.js, same as the other suites run
// against the compiled lib.js. The async Supabase sync itself is covered
// by the live API test, not here.
export default function suite({ lib, cloud }, h) {
  const { defaultTemplates } = lib;

  const account = {
    name: "Mike Carter",
    businessName: "Carter Remodeling LLC",
    trade: "Remodeling",
    email: "mike@carter.example",
    password: "secret",
    createdAt: "2026-11-01T10:00:00.000Z",
  };
  const profile = {
    businessName: "Carter Remodeling LLC",
    ownerName: "Mike Carter",
    replyEmail: "mike@carter.example",
    bookingLink: "https://calendly.com/carter",
    trade: "Remodeling",
  };
  const q1 = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "James Miller", email: "james@example.com", amount: 8400,
    date: "2026-08-14", jobType: "Kitchen remodel", status: "In sequence", reply: "Interested",
  };
  const q2 = {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Sarah Thompson", email: "sarah@example.com", amount: 3200.5,
    date: "2026-08-28", jobType: "Bathroom tiling", status: "New", reply: "",
  };
  const t1 = {
    id: "33333333-3333-4333-8333-333333333333",
    quoteId: q1.id, touchIndex: 1, dayOffset: 3, dueDate: "2026-11-19",
    status: "sent", sentAt: "2026-11-19",
  };
  const state = {
    account, profile,
    quotes: [q1, q2],
    templates: defaultTemplates(),
    touches: [t1],
  };
  const USER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const CAMP = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  h.area("UUID detection");
  h.ok(cloud.isUuid(q1.id), "real uuid accepted");
  h.ok(cloud.isUuid("AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA"), "uppercase uuid accepted");
  h.ok(!cloud.isUuid("sample-1"), "sample id rejected");
  h.ok(!cloud.isUuid("demo-t-sample-1-0"), "demo touch id rejected");
  h.ok(!cloud.isUuid(""), "empty string rejected");

  h.area("ID normalization");
  let n = 0;
  const gen = () => `99999999-9999-4999-8999-${String(++n).padStart(12, "0")}`;
  const local = {
    account, profile,
    quotes: [
      { ...q1, id: "sample-1" },
      { ...q2, id: "22222222-2222-4222-8222-222222222222" },
    ],
    templates: defaultTemplates(),
    touches: [{ ...t1, id: "touch-x", quoteId: "sample-1" }],
  };
  const { state: norm, quoteIdMap } = cloud.normalizeStateIds(local, gen);
  h.ok(cloud.isUuid(norm.quotes[0].id), "non-uuid quote id replaced with uuid");
  h.eq(norm.quotes[1].id, "22222222-2222-4222-8222-222222222222", "uuid quote id preserved");
  h.eq(norm.touches[0].quoteId, norm.quotes[0].id, "touch re-pointed at the new quote id");
  h.ok(cloud.isUuid(norm.touches[0].id), "non-uuid touch id replaced with uuid");
  h.eq(quoteIdMap.get("sample-1"), norm.quotes[0].id, "quote id map records old -> new");
  h.eq(quoteIdMap.size, 1, "map only holds remapped quotes");
  const again = cloud.normalizeStateIds(norm, gen);
  h.eq(again.quoteIdMap.size, 0, "second pass is a no-op (all uuids)");
  h.ok(!cloud.stateNeedsIdNormalization(norm), "normalized state needs no further work");
  h.ok(cloud.stateNeedsIdNormalization(local), "local state flagged as needing normalization");

  h.area("Profile row mapping");
  const prow = cloud.profileToRow(state, USER);
  h.eq(prow.id, USER, "profile row id is the auth user id");
  h.eq(prow.business_name, "Carter Remodeling LLC", "business name mapped");
  h.eq(prow.owner_name, "Mike Carter", "owner name mapped");
  h.eq(prow.reply_to_email, "mike@carter.example", "reply email mapped");
  h.eq(prow.booking_link, "https://calendly.com/carter", "booking link mapped");
  h.eq(prow.trial_start, account.createdAt, "trial start comes from account creation");

  h.area("Quote row mapping");
  const qrow = cloud.quoteToRow(q1, USER);
  h.eq(qrow.customer_name, "James Miller", "customer name mapped");
  h.eq(qrow.quote_date, "2026-08-14", "quote date mapped");
  h.eq(qrow.amount, 8400, "amount mapped");
  h.eq(qrow.user_id, USER, "user id stamped");
  h.eq(qrow.phone, null, "phone is null (app collects none)");
  const back1 = cloud.rowToQuote(qrow, "Interested");
  h.deepEq(back1, q1, "quote -> row -> quote round-trips (with reply applied)");
  const back2 = cloud.rowToQuote(cloud.quoteToRow(q2, USER), "");
  h.deepEq(back2, q2, "quote without reply round-trips");

  h.area("Touch row mapping");
  const trow = cloud.touchToRow(t1, USER, CAMP);
  h.eq(trow.campaign_id, CAMP, "campaign id stamped");
  h.eq(trow.quote_id, q1.id, "quote id stamped");
  h.eq(trow.touch_index, 1, "touch index mapped");
  h.ok(typeof trow.sent_at === "string" && trow.sent_at.startsWith("2026-11-19"), "sent date becomes a timestamptz on the same day");
  const backT = cloud.rowToTouch(trow);
  h.eq(backT.sentAt, "2026-11-19", "timestamptz converts back to the same date");
  h.eq(backT.dayOffset, 3, "day offset derived from touch index");
  const pendingRow = cloud.touchToRow({ ...t1, status: "pending", sentAt: undefined }, USER, CAMP);
  h.eq(pendingRow.sent_at, null, "unsent touch has null sent_at");
  h.eq(cloud.rowToTouch(pendingRow).sentAt, undefined, "null sent_at comes back as undefined");

  h.area("Reply rows");
  const rrows = cloud.replyRowsFor(state, USER);
  h.eq(rrows.length, 1, "only quotes with a reply produce a row");
  h.eq(rrows[0].quote_id, q1.id, "reply row points at the replied quote");
  h.eq(rrows[0].status, "Interested", "reply status mapped");
  h.eq(rrows[0].user_id, USER, "reply row user id stamped");

  h.area("Rows -> state hydration");
  const rows = {
    profile: prow,
    quotes: [cloud.quoteToRow(q1, USER), cloud.quoteToRow(q2, USER)],
    campaign: cloud.campaignToRow(state, USER, CAMP),
    touches: [cloud.touchToRow(t1, USER, CAMP)],
    replies: rrows,
  };
  const hydrated = cloud.rowsToState(rows, "mike@carter.example", defaultTemplates());
  h.eq(hydrated.account.email, "mike@carter.example", "account email comes from auth");
  h.eq(hydrated.account.password, "", "password is never stored in cloud state");
  h.eq(hydrated.account.createdAt, account.createdAt, "trial clock is profile trial_start");
  h.eq(hydrated.profile.bookingLink, "https://calendly.com/carter", "profile booking link hydrated");
  h.deepEq(hydrated.quotes, [q1, q2], "quotes hydrated with replies joined in");
  h.deepEq(hydrated.touches, [t1], "touches hydrated");
  h.deepEq(hydrated.templates, state.templates, "templates hydrated from the campaign row");

  h.area("Hydration fallbacks");
  const bare = cloud.rowsToState(
    { profile: null, quotes: [], campaign: null, touches: [], replies: [] },
    "new@example.com",
    defaultTemplates()
  );
  h.deepEq(bare.templates, defaultTemplates(), "no campaign row -> fallback templates");
  h.eq(bare.profile.replyEmail, "new@example.com", "no profile -> reply email falls back to account email");
  h.eq(bare.quotes.length, 0, "no quotes -> empty list");
  const badTpl = cloud.rowsToState(
    { profile: prow, quotes: [], campaign: { id: CAMP, user_id: USER, name: "x", templates: [{ nope: 1 }] }, touches: [], replies: [] },
    "mike@carter.example",
    defaultTemplates()
  );
  h.deepEq(badTpl.templates, defaultTemplates(), "malformed campaign templates -> fallback templates");
}
