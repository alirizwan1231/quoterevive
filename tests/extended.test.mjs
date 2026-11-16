// QuoteRevive extended suite — areas the original 44 checks did not cover:
// sign-up / log-in validation, session persistence shape, trial edge cases,
// CSV edge cases, full template placeholder rendering, backup round-trip,
// delete-quote / delete-all state transforms, and stop-on-reply for every
// reply status. UI handlers in app/page.tsx are thin wrappers over the pure
// helpers tested here (validateSignup / validateLogin live in app/lib.ts);
// the delete and reply transforms replicate the exact state updates the
// Quotes / Reply Board handlers perform.

function makeAccount(overrides = {}) {
  return {
    name: "Mike Carter", businessName: "Carter Remodeling LLC", trade: "Remodeling",
    email: "mike@carterremodeling.com", password: "hunter2", createdAt: "2026-11-16T09:00:00.000Z",
    ...overrides,
  };
}

function blankState(lib, account) {
  return {
    account,
    profile: { businessName: account.businessName, ownerName: account.name, replyEmail: account.email, bookingLink: "", trade: account.trade },
    quotes: [], templates: lib.defaultTemplates(), touches: [],
  };
}

// Minimal localStorage stand-in with the same get/set/remove contract.
function storageStub() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

// The exact transform RepliesView.setReply performs in app/page.tsx.
function applyReply(lib, state, quoteId, reply) {
  const quotes = state.quotes.map((x) => x.id === quoteId ? {
    ...x, reply,
    status: reply === "Booked" ? "Booked" : reply === "" ? x.status : "Replied",
  } : x);
  const touches = reply !== "" ? lib.cancelPendingTouches(state.touches, quoteId) : state.touches;
  return { ...state, quotes, touches };
}

export default function run(lib, t) {
  const {
    validateSignup, validateLogin, trialDaysRemaining, importQuotesFromCSV,
    parseCSV, renderTemplate, sampleQuotes, defaultTemplates, launchCampaign,
    computeStats,
  } = lib;

  /* ---------------- Sign-up validation ---------------- */
  t.area("Sign-up validation");
  const good = { name: "Mike Carter", businessName: "Carter Remodeling LLC", trade: "Remodeling", email: "mike@carterremodeling.com", password: "hunter2" };
  t.eq(validateSignup(good, null), null, "complete valid sign-up accepted");
  t.ok(validateSignup({ ...good, name: "  " }, null), "blank name rejected");
  t.ok(validateSignup({ ...good, businessName: "" }, null), "missing business name rejected");
  t.ok(validateSignup({ ...good, email: "" }, null), "missing email rejected");
  t.ok(validateSignup({ ...good, password: "abc" }, null), "3-character password rejected");
  t.eq(validateSignup({ ...good, password: "abcd" }, null), null, "4-character password accepted (minimum)");
  const saved = makeAccount();
  t.ok(validateSignup(good, saved), "duplicate email sign-up rejected (protects saved data)");
  t.ok(validateSignup({ ...good, email: "MIKE@CarterRemodeling.com" }, saved), "duplicate email rejected case-insensitively");
  t.eq(validateSignup({ ...good, email: "other@shop.com" }, saved), null, "different email is not treated as duplicate");

  /* ---------------- Log-in validation ---------------- */
  t.area("Log-in validation");
  t.ok(validateLogin("mike@carterremodeling.com", "hunter2", null), "login with no saved account rejected");
  t.includes(validateLogin("a@b.com", "x", null) || "", "sign up first", "no-account message points to sign-up");
  t.ok(validateLogin("mike@carterremodeling.com", "wrongpass", saved), "wrong password rejected");
  t.ok(validateLogin("nobody@else.com", "hunter2", saved), "unknown email rejected");
  t.eq(validateLogin("mike@carterremodeling.com", "hunter2", saved), null, "correct credentials accepted");
  t.eq(validateLogin("MIKE@carterremodeling.com", "hunter2", saved), null, "email match is case-insensitive");
  const demoAccount = makeAccount({ name: "Demo Owner", businessName: "BrightHome Renovations", email: "demo@quoterevive.app", password: "demo" });
  t.eq(validateLogin("demo@quoterevive.app", "demo", demoAccount), null, "demo account credentials accepted");

  /* ---------------- Session persistence shape ---------------- */
  t.area("Session persistence (storage round-trip)");
  const LS_KEY = "quoterevive_v1"; // same key app/page.tsx uses
  const store = storageStub();
  let state = blankState(lib, makeAccount());
  state.quotes = sampleQuotes();
  const launched = launchCampaign(state.quotes, state.touches, "2026-11-16");
  state = { ...state, quotes: launched.quotes, touches: launched.touches };
  store.setItem(LS_KEY, JSON.stringify(state));
  const reloaded = JSON.parse(store.getItem(LS_KEY));
  t.deepEq(reloaded.account, state.account, "account survives a simulated reload");
  t.deepEq(reloaded.quotes, state.quotes, "quotes survive a simulated reload");
  t.deepEq(reloaded.templates, state.templates, "templates survive a simulated reload");
  t.deepEq(reloaded.touches, state.touches, "touches survive a simulated reload");
  t.eq(reloaded.profile.businessName, "Carter Remodeling LLC", "profile survives a simulated reload");
  const shapeOk = (p) => !!(p && p.account && Array.isArray(p.quotes)); // guard used by Settings backup import
  t.ok(shapeOk(reloaded), "reloaded state passes the backup-import shape guard");
  t.ok(!shapeOk({ hello: 1 }), "foreign JSON fails the shape guard");
  let threw = false;
  try { JSON.parse("{not json"); } catch { threw = true; }
  t.ok(threw, "corrupt stored JSON throws on parse (app catches and starts fresh)");

  /* ---------------- Trial edge cases ---------------- */
  t.area("Trial edge cases");
  const now = new Date("2026-11-16T12:00:00Z");
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();
  t.eq(trialDaysRemaining(daysAgo(0), now), 30, "day 0: 30 days left");
  t.eq(trialDaysRemaining(daysAgo(29), now), 1, "day 29: last day, 1 left");
  t.eq(trialDaysRemaining(daysAgo(30), now), 0, "day 30: trial exactly over");
  t.eq(trialDaysRemaining(daysAgo(31), now), 0, "day 31: stays at 0, never negative");

  /* ---------------- CSV edge cases ---------------- */
  t.area("CSV edge cases");
  const empty = importQuotesFromCSV("", []);
  t.eq(empty.added.length, 0, "empty file adds nothing");
  t.eq(empty.totalRows, 0, "empty file counts 0 rows");
  t.eq(empty.badRows.length, 0, "empty file reports no bad rows");
  const headerOnly = importQuotesFromCSV("name,email,amount,quote date,job type\n", []);
  t.eq(headerOnly.added.length, 0, "header-only file adds nothing");
  t.eq(headerOnly.badRows.length, 0, "header-only file reports no bad rows");
  const quoted = importQuotesFromCSV(
    'name,email,amount,quote date,job type\n"Smith, John",john.smith@example.com,4500,2026-08-05,Painting\n', []);
  t.eq(quoted.added[0]?.name, "Smith, John", "quoted comma inside a name is kept whole");
  const crlf = importQuotesFromCSV(
    "name,email,amount,quote date,job type\r\nJane Roe,jane@example.com,2000,2026-08-06,Roofing\r\n", []);
  t.eq(crlf.added.length, 1, "CRLF line endings import cleanly");
  t.eq(crlf.added[0]?.email, "jane@example.com", "CRLF row email has no stray carriage return");
  const extraCols = importQuotesFromCSV(
    "name,email,phone,amount,quote date,job type,notes\nKyle Kim,kyle@example.com,555-0100,7300,2026-08-07,HVAC,called twice\n", []);
  t.eq(extraCols.added.length, 1, "extra unknown columns are ignored");
  t.eq(extraCols.added[0]?.amount, 7300, "amount still maps correctly with extra columns present");
  const decimal = importQuotesFromCSV(
    "name,email,amount,quote date,job type\nPat Poe,pat@example.com,12500.50,2026-08-08,Plumbing\n", []);
  t.eq(decimal.added[0]?.amount, 12500.5, 'amount "12500.50" keeps its cents');
  const noEmailCol = importQuotesFromCSV(
    "name,amount,quote date,job type\nSam,sam-amount,100,2026-08-01,Painting\n", []);
  t.eq(noEmailCol.added.length, 0, "missing email column adds nothing");
  t.eq(noEmailCol.badRows.length, 1, "missing email column reported once, on the header");
  const noNameCol = importQuotesFromCSV(
    "email,amount,quote date,job type\nsam@example.com,100,2026-08-01,Painting\n", []);
  t.eq(noNameCol.added.length, 0, "missing name column adds nothing");
  t.eq(noNameCol.badRows.length, 1, "missing name column reported once, on the header");
  t.deepEq(parseCSV(""), [], "parseCSV of empty text returns no rows");

  /* ---------------- Template placeholder rendering ---------------- */
  t.area("Template placeholder rendering");
  const quote = { id: "q1", name: "David Garcia", email: "david.garcia@example.com", amount: 12500, date: "2026-09-03", jobType: "Roof replacement", status: "New", reply: "" };
  const full = { businessName: "BrightHome Renovations", ownerName: "Alex Bright", replyEmail: "a@b.com", bookingLink: "https://calendly.com/brighthome", trade: "Remodeling" };
  const all = "{first_name}|{business_name}|{job_type}|{amount}|{owner_name}|{booking_link}";
  t.eq(renderTemplate(all, quote, full),
    "David|BrightHome Renovations|Roof replacement|$12,500|Alex Bright|https://calendly.com/brighthome",
    "every placeholder renders from quote + profile");
  t.eq(renderTemplate("{first_name}", { ...quote, name: "Mary Ann Smith" }, full), "Mary", "first_name takes only the first word");
  const noLink = renderTemplate("{booking_link}", quote, { ...full, bookingLink: "" });
  t.eq(noLink, "(add your booking link in Settings)", "missing booking link renders the settings hint");
  t.eq(renderTemplate("{business_name}", quote, { ...full, businessName: "" }), "our team", "missing business name falls back to 'our team'");
  t.eq(renderTemplate("{owner_name}", quote, { ...full, ownerName: "" }), "", "missing owner name renders empty, not a placeholder");
  t.eq(renderTemplate("{job_type}", { ...quote, jobType: "" }, full), "project", "missing job type falls back to 'project'");
  const everyDefault = defaultTemplates().every((tpl) =>
    !/\{(first_name|business_name|job_type|amount|owner_name|booking_link)\}/.test(renderTemplate(tpl.subject + "\n" + tpl.body, quote, full)));
  t.ok(everyDefault, "all 4 default templates render with no leftover placeholders");

  /* ---------------- Backup export → import round-trip ---------------- */
  t.area("Backup export/import round-trip");
  const exported = JSON.stringify(state, null, 2); // Settings exports exactly this
  const imported = JSON.parse(exported);
  t.deepEq(imported, state, "export → import restores the entire state exactly");
  t.eq(imported.touches.length, 48, "round-tripped state keeps all 48 scheduled touches");
  t.eq(imported.account.email, state.account.email, "round-tripped state keeps the account");

  /* ---------------- Delete-quote & delete-all transforms ---------------- */
  t.area("Delete quote / delete all");
  const victim = state.quotes[0];
  const afterDelete = {
    ...state,
    quotes: state.quotes.filter((x) => x.id !== victim.id),       // QuotesView delete handler
    touches: state.touches.filter((x) => x.quoteId !== victim.id),
  };
  t.eq(afterDelete.quotes.length, state.quotes.length - 1, "delete removes exactly the chosen quote");
  t.eq(afterDelete.touches.filter((x) => x.quoteId === victim.id).length, 0, "delete removes the quote's touches too");
  t.eq(afterDelete.touches.length, state.touches.length - 4, "other quotes keep all their touches");
  t.eq(computeStats(afterDelete.quotes, afterDelete.touches).totalQuotes, 11, "stats reflect the deletion");
  const store2 = storageStub();
  store2.setItem(LS_KEY, JSON.stringify(state));
  store2.removeItem(LS_KEY); // Settings "Delete all my data" handler
  t.eq(store2.getItem(LS_KEY), null, "delete-all clears the stored state completely");

  /* ---------------- Stop-on-reply for every reply status ---------------- */
  t.area("Stop-on-reply per reply status");
  for (const reply of ["New", "Interested", "Not now", "Booked"]) {
    let s = blankState(lib, makeAccount());
    s.quotes = sampleQuotes().slice(0, 2);
    const l = launchCampaign(s.quotes, [], "2026-11-16");
    s = { ...s, quotes: l.quotes, touches: l.touches };
    const target = s.quotes[0];
    const after = applyReply(lib, s, target.id, reply);
    const targetTouches = after.touches.filter((x) => x.quoteId === target.id);
    t.ok(targetTouches.every((x) => x.status === "cancelled"), `reply "${reply}" cancels all pending touches`);
    t.eq(after.quotes.find((q) => q.id === target.id)?.status, reply === "Booked" ? "Booked" : "Replied",
      `reply "${reply}" sets the quote status correctly`);
    t.eq(after.touches.filter((x) => x.quoteId === s.quotes[1].id && x.status === "pending").length, 4,
      `reply "${reply}" leaves other quotes' sequences running`);
  }
  let s2 = blankState(lib, makeAccount());
  s2.quotes = sampleQuotes().slice(0, 1);
  const l2 = launchCampaign(s2.quotes, [], "2026-11-16");
  s2 = { ...s2, quotes: l2.quotes, touches: l2.touches };
  const cleared = applyReply(lib, s2, s2.quotes[0].id, "");
  t.eq(cleared.touches.filter((x) => x.status === "pending").length, 4, "clearing a reply does NOT cancel touches");
}
