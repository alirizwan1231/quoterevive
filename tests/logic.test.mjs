// QuoteRevive core logic suite — the original 44 assertions, reconstructed as a
// permanent runnable file (rounds 1–3 ran these checks ad hoc against the
// compiled app/lib.ts; they now live in the repo).
// Covers: calculator math, money/date formatting, CSV import (sample file,
// duplicates, bad rows, money parsing), campaign launch + due dates, relaunch
// guard, Gmail compose URL, mark-sent, stop-on-reply, revived-$ stats, trial
// countdown.

export default function run(lib, t) {
  const {
    TOUCH_DAYS, SAMPLE_CSV, sampleQuotes, defaultTemplates, importQuotesFromCSV,
    normalizeDate, addDays, launchCampaign, cancelPendingTouches, markTouchSent,
    computeStats, renderTemplate, gmailComposeUrl, trialDaysRemaining, money,
  } = lib;

  // The landing-page calculator formula (app/page.tsx): idle = quotes × avg,
  // potential = round(idle × pct / 100).
  const calc = (q, avg, pct) => ({ idle: q * avg, potential: Math.round((q * avg * pct) / 100) });

  t.area("Calculator math");
  t.eq(calc(40, 6500, 10).idle, 260000, "default idle pipeline 40 × $6,500");
  t.eq(calc(40, 6500, 10).potential, 26000, "default potential at 10%");
  t.eq(calc(7, 333, 15).potential, 350, "potential rounds to nearest dollar");

  t.area("Money & date formatting");
  t.eq(money(12500), "$12,500", "money formats thousands");
  t.eq(money(0), "$0", "money zero");
  t.eq(normalizeDate("2026-09-03"), "2026-09-03", "ISO date passes through");
  t.eq(normalizeDate("09/03/2026"), "2026-09-03", "US MM/DD/YYYY date parsed");
  t.eq(normalizeDate("not a date"), null, "garbage date rejected");
  t.eq(addDays("2026-11-16", 25), "2026-12-11", "addDays crosses month boundary");

  t.area("CSV import — sample file");
  const sample = importQuotesFromCSV(SAMPLE_CSV, []);
  t.eq(sample.added.length, 3, "sample CSV adds 3 quotes");
  t.eq(sample.totalRows, 3, "sample CSV counts 3 data rows");
  t.eq(sample.duplicates, 0, "sample CSV has no duplicates");
  t.eq(sample.badRows.length, 0, "sample CSV has no bad rows");

  t.area("CSV import — duplicates");
  const existing = [{ id: "x1", name: "James Miller", email: "james.miller@example.com", amount: 1, date: "2026-01-01", jobType: "Test", status: "New", reply: "" }];
  const dupExisting = importQuotesFromCSV(SAMPLE_CSV, existing);
  t.eq(dupExisting.duplicates, 1, "email already on file counted as duplicate");
  t.eq(dupExisting.added.length, 2, "non-duplicate rows still added");
  const inFile = importQuotesFromCSV(
    "name,email,amount,quote date,job type\nAnn A,ann@example.com,100,2026-08-01,Painting\nAnn Again,ann@example.com,200,2026-08-02,Painting\n", []);
  t.eq(inFile.added.length, 1, "in-file duplicate added only once");
  t.eq(inFile.duplicates, 1, "in-file duplicate counted");

  t.area("CSV import — bad rows & amounts");
  const badEmail = importQuotesFromCSV(
    "name,email,amount,quote date,job type\nBob,bob-at-example,100,2026-08-01,Painting\n", []);
  t.eq(badEmail.badRows.length, 1, "invalid email flagged as bad row");
  const noName = importQuotesFromCSV(
    "name,email,amount,quote date,job type\n,noname@example.com,100,2026-08-01,Painting\n", []);
  t.eq(noName.badRows.length, 1, "missing name flagged as bad row");
  t.includes(noName.badRows[0]?.reason || "", "Missing name", "missing-name reason is clear");
  const moneyCsv = importQuotesFromCSV(
    'name,email,amount,quote date,job type\nDavid Garcia,david.garcia@example.com,"$12,500",2026-09-03,Roof replacement\n', []);
  t.eq(moneyCsv.added[0]?.amount, 12500, '"$12,500" parses to 12500');

  t.area("Campaign launch");
  t.deepEq(TOUCH_DAYS, [0, 3, 10, 25], "touch schedule is day 0/3/10/25");
  const launched = launchCampaign(sampleQuotes(), [], "2026-11-16");
  t.eq(launched.launched, 12, "12 sample quotes launched");
  t.eq(launched.touches.length, 48, "48 touches scheduled (12 × 4)");
  t.eq(launched.quotes.filter((q) => q.status === "In sequence").length, 12, "all quotes move to In sequence");
  const firstQuoteTouches = launched.touches.filter((x) => x.quoteId === launched.quotes[0].id);
  t.deepEq(firstQuoteTouches.map((x) => x.dueDate).sort(),
    ["2026-11-16", "2026-11-19", "2026-11-26", "2026-12-11"], "due dates are start, +3, +10, +25 days");
  t.eq(launched.touches.every((x) => x.status === "pending"), true, "all touches start pending");

  t.area("Campaign relaunch guard");
  const relaunched = launchCampaign(launched.quotes, launched.touches, "2026-11-16");
  t.eq(relaunched.launched, 0, "relaunch launches nothing twice");
  t.eq(relaunched.touches.length, 48, "relaunch adds no duplicate touches");

  t.area("Gmail compose URL");
  const profile = { businessName: "BrightHome Renovations", ownerName: "Demo Owner", replyEmail: "demo@quoterevive.app", bookingLink: "https://calendly.com/", trade: "Remodeling" };
  const david = sampleQuotes()[2];
  const tpl = defaultTemplates()[0];
  const subject = renderTemplate(tpl.subject, david, profile);
  const body = renderTemplate(tpl.body, david, profile);
  const url = gmailComposeUrl(david.email, subject, body);
  const expected = "https://mail.google.com/mail/?" + new URLSearchParams({ view: "cm", fs: "1", to: david.email, su: subject, body }).toString();
  t.eq(url, expected, "compose URL matches expected encoding exactly");
  t.ok(url.startsWith("https://mail.google.com/mail/?"), "compose URL base is Gmail");
  t.eq(new URL(url).searchParams.get("to"), "david.garcia@example.com", "compose URL carries recipient");

  t.area("Mark sent");
  const oneTouch = launched.touches[0];
  const afterSend = markTouchSent(launched.touches, oneTouch.id, "2026-11-16");
  t.eq(afterSend.find((x) => x.id === oneTouch.id)?.status, "sent", "marked touch becomes sent");
  t.eq(afterSend.find((x) => x.id === oneTouch.id)?.sentAt, "2026-11-16", "sent date recorded");
  t.eq(afterSend.filter((x) => x.status === "sent").length, 1, "only the marked touch is sent");

  t.area("Stop-on-reply (cancel pending)");
  const q1 = launched.quotes[0];
  const mixed = markTouchSent(launched.touches, launched.touches.find((x) => x.quoteId === q1.id).id, "2026-11-16");
  const cancelled = cancelPendingTouches(mixed, q1.id);
  t.eq(cancelled.filter((x) => x.quoteId === q1.id && x.status === "cancelled").length, 3, "3 pending touches cancelled on reply");
  t.eq(cancelled.find((x) => x.quoteId === q1.id && x.sentAt)?.status, "sent", "already-sent touch is kept sent");

  t.area("Stats & revived revenue");
  const bookedQuotes = launched.quotes.map((q) => q.id === david.id ? { ...q, status: "Booked", reply: "Booked" } : q);
  const stats = computeStats(bookedQuotes, launched.touches);
  t.eq(stats.booked, 1, "one booked job counted");
  t.eq(stats.revivedValue, 12500, "revived revenue is the booked $12,500 job");
  t.eq(stats.replies, 1, "one reply counted");
  t.eq(stats.idleValue, 68100, "idle value excludes the booked job ($80,600 − $12,500)");

  t.area("Trial countdown");
  const now = new Date("2026-11-16T12:00:00Z");
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();
  t.eq(trialDaysRemaining(daysAgo(0), now), 30, "day 0: full 30 days remain");
  t.eq(trialDaysRemaining(daysAgo(5), now), 25, "day 5: 25 days remain");
  t.eq(trialDaysRemaining(daysAgo(30), now), 0, "day 30: trial over");
}
