"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AppState, Quote, Template, Touch, QuoteStatus, ReplyStatus,
  defaultTemplates, sampleQuotes, launchCampaign, cancelPendingTouches, markTouchSent,
  computeStats, importQuotesFromCSV, ImportReport, SAMPLE_CSV, renderTemplate,
  gmailComposeUrl, trialDaysRemaining, money, todayISO, uid,
} from "./lib";

const LS_KEY = "quoterevive_v1";
const TRADES = ["Remodeling", "HVAC", "Roofing", "Painting", "Landscaping", "Plumbing", "Electrical", "Other home service"];

function blankState(name: string, businessName: string, trade: string, email: string, password: string): AppState {
  return {
    account: { name, businessName, trade, email, password, createdAt: new Date().toISOString() },
    profile: { businessName, ownerName: name, replyEmail: email, bookingLink: "", trade },
    quotes: [],
    templates: defaultTemplates(),
    touches: [],
  };
}

function demoState(): AppState {
  const s = blankState("Demo Owner", "BrightHome Renovations", "Remodeling", "demo@quoterevive.app", "demo");
  s.profile.bookingLink = "https://calendly.com/";
  s.quotes = sampleQuotes();
  return s;
}

type View = "dashboard" | "quotes" | "campaign" | "send" | "replies" | "settings";

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [authError, setAuthError] = useState("");
  const [session, setSession] = useState(false);

  // calculator
  const [calcQuotes, setCalcQuotes] = useState(40);
  const [calcAvg, setCalcAvg] = useState(6500);
  const [calcPct, setCalcPct] = useState(10);
  const idle = calcQuotes * calcAvg;
  const potential = Math.round((idle * calcPct) / 100);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded && state) localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state, loaded]);

  const stats = useMemo(() => (state ? computeStats(state.quotes, state.touches) : null), [state]);
  const daysLeft = state ? trialDaysRemaining(state.account.createdAt) : 0;

  function update(fn: (s: AppState) => AppState) {
    setState((prev) => (prev ? fn(prev) : prev));
  }

  function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const businessName = String(fd.get("business") || "").trim();
    const trade = String(fd.get("trade") || "Remodeling");
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    if (!name || !businessName || !email || password.length < 4) {
      setAuthError("Please fill in every field (password at least 4 characters).");
      return;
    }
    setAuthError("");
    setState(blankState(name, businessName, trade, email, password));
    setSession(true);
    setView("dashboard");
  }

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    if (!state) { setAuthError("No account found on this device yet — please sign up first, or use the demo."); return; }
    if (state.account.email.toLowerCase() === email.toLowerCase() && state.account.password === password) {
      setAuthError("");
      setSession(true);
      setView("dashboard");
    } else setAuthError("Email or password does not match the account saved on this device.");
  }

  function logout() {
    // Data stays saved on this device; logging in again restores it.
    setSession(false);
  }


  return (
    <div>
      <div className="topbar">
        <div className="wrap">
          <a className="logo" href="#" onClick={(e) => e.preventDefault()}>Quote<span>Revive</span></a>
          {state && session ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span className="tag" style={{ background: "#173656", color: "#9fe8cb" }}>
                {daysLeft > 0 ? `Free trial: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Free trial ended"}
              </span>
              <span className="small" style={{ color: "#c8d4e2" }}>{state.profile.businessName}</span>
              <button className="btn small grey" onClick={logout}>Log out</button>
            </div>
          ) : (
            <span className="small" style={{ color: "#c8d4e2" }}>For home-service contractors</span>
          )}
        </div>
      </div>

      {!(state && session) ? (
        <main>
          <div className="wrap hero">
            <span className="tag">1 month free for every new account — no card required</span>
            <h1 style={{ marginTop: 14 }}>Your old quotes are sitting on money.<br />We follow them up for you.</h1>
            <p className="sub">
              Every month you send quotes that never get a reply. QuoteRevive imports those dead quotes and runs a
              friendly 4-touch email follow-up in your voice — so work you already quoted can still turn into booked jobs.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
              <a className="btn" href="#get-started">Start my free month</a>
              <button className="btn ghost" onClick={() => { setState(demoState()); setSession(true); }}>Try the demo account</button>
            </div>
            <p className="small muted" style={{ marginTop: 12 }}>
              After your free month, QuoteRevive will be $10/month — no card required now.
            </p>
          </div>

          <section style={{ background: "#fff", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
            <div className="wrap">
              <h2>How it works</h2>
              <div className="grid c3" style={{ marginTop: 14 }}>
                <div className="card"><h3>1. Import your dead quotes</h3><p className="muted">Upload a CSV from Jobber, QuickBooks or a spreadsheet — or add quotes one by one. Name, email, amount, job type. That is all we need.</p></div>
                <div className="card"><h3>2. Launch the sequence</h3><p className="muted">Four short, polite follow-up emails over 25 days, written in your voice and editable by you. Sending happens from your own Gmail, one click per email.</p></div>
                <div className="card"><h3>3. Watch replies come in</h3><p className="muted">Every reply lands on one simple board. Mark jobs as booked and see exactly how much revenue you revived.</p></div>
              </div>
            </div>
          </section>

          <section>
            <div className="wrap">
              <h2>The 4-touch sequence</h2>
              <p className="muted" style={{ maxWidth: 640 }}>Polite, spaced out, and it stops the moment a customer replies. You can edit every word before you launch.</p>
              <div className="grid c2" style={{ marginTop: 10 }}>
                {defaultTemplates().map((t, i) => (
                  <div className="card" key={t.day} style={{ display: "flex", gap: 14 }}>
                    <div className="seqdot">{i + 1}</div>
                    <div>
                      <strong>Day {t.day} — {t.subject.replace("{job_type}", "kitchen remodel")}</strong>
                      <p className="small muted" style={{ marginTop: 6, whiteSpace: "pre-line" }}>{t.body.split("\n").slice(0, 3).join("\n")}…</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ background: "#fff", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
            <div className="wrap grid c2" style={{ alignItems: "start" }}>
              <div>
                <h2>Dead Quote Calculator</h2>
                <p className="muted">How much money is sitting in quotes you already sent? Move the sliders and see. Even a small revival rate can mean one or two extra jobs a month.</p>
                <label>Unsold quotes in the last 12 months: {calcQuotes}</label>
                <input type="range" min={0} max={300} value={calcQuotes} onChange={(e) => setCalcQuotes(Number(e.target.value))} />
                <label>Average job value ($)</label>
                <input type="number" min={0} value={calcAvg} onChange={(e) => setCalcAvg(Number(e.target.value))} />
                <label>If just this % reply and book: {calcPct}%</label>
                <input type="range" min={1} max={30} value={calcPct} onChange={(e) => setCalcPct(Number(e.target.value))} />
              </div>
              <div className="card" style={{ background: "var(--accent-soft)", borderColor: "#bfe3d6" }}>
                <p className="muted" style={{ marginBottom: 4 }}>Pipeline sitting idle</p>
                <div className="stat-num" data-testid="idle-value">{money(idle)}</div>
                <p className="muted" style={{ margin: "14px 0 4px" }}>Potential revived revenue at {calcPct}%</p>
                <div className="stat-num" data-testid="potential-value">{money(potential)}</div>
                <p className="small muted" style={{ marginTop: 12 }}>An estimate to show the size of the opportunity — your real results depend on your quotes and your market.</p>
              </div>
            </div>
          </section>

          <section id="get-started">
            <div className="wrap grid c2" style={{ alignItems: "start" }}>
              <div>
                <h2>Start your free month</h2>
                <p className="muted">Every account starts with a full month free. No pricing and no card during testing — after the free month the plan will be $10/month.</p>
                <p className="small muted">Testing build note: this early version keeps your account and quotes on this device only. Cloud accounts and automatic sending arrive before the public launch.</p>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className={`btn small ${authMode === "signup" ? "" : "grey"}`} onClick={() => setAuthMode("signup")}>Sign up</button>
                  <button className={`btn small ${authMode === "login" ? "" : "grey"}`} onClick={() => setAuthMode("login")}>Log in</button>
                </div>
              </div>
              <div className="card">
                {authMode === "signup" ? (
                  <form onSubmit={handleSignup}>
                    <label>Your name</label>
                    <input name="name" type="text" placeholder="e.g. Mike Carter" required />
                    <label>Business name</label>
                    <input name="business" type="text" placeholder="e.g. Carter Remodeling LLC" required />
                    <label>Trade</label>
                    <select name="trade">{TRADES.map((t) => <option key={t}>{t}</option>)}</select>
                    <label>Email</label>
                    <input name="email" type="email" placeholder="you@yourbusiness.com" required />
                    <label>Password</label>
                    <input name="password" type="password" placeholder="At least 4 characters" required />
                    {authError && <p className="small" style={{ color: "var(--bad)", marginTop: 10 }}>{authError}</p>}
                    <button className="btn" style={{ marginTop: 16, width: "100%" }} type="submit">Create my free account</button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin}>
                    <label>Email</label>
                    <input name="email" type="email" required />
                    <label>Password</label>
                    <input name="password" type="password" required />
                    {authError && <p className="small" style={{ color: "var(--bad)", marginTop: 10 }}>{authError}</p>}
                    <button className="btn" style={{ marginTop: 16, width: "100%" }} type="submit">Log in</button>
                    <p className="small muted" style={{ marginTop: 10 }}>Accounts live on this device in this testing build. No account here yet? Sign up or try the demo.</p>
                  </form>
                )}
                <button className="btn ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => { setState(demoState()); setSession(true); }}>Load the demo account with sample quotes</button>
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="wrap" style={{ paddingBottom: 30 }}>
          <div className="navtabs">
            {(["dashboard", "quotes", "campaign", "send", "replies", "settings"] as View[]).map((v) => (
              <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
                {v === "send" ? "Send Center" : v === "replies" ? "Reply Board" : v.charAt(0).toUpperCase() + v.slice(1)}
                {v === "send" && stats && stats.touchesPending > 0 ? ` (${stats.touchesPending})` : ""}
              </button>
            ))}
          </div>

          {daysLeft <= 0 && (
            <div className="notice" style={{ marginBottom: 16 }}>
              <strong>Your free month has ended.</strong> QuoteRevive will be $10/month — paid plans are not switched on yet during testing, so you can keep using everything.
            </div>
          )}

          {view === "dashboard" && stats && (
            <Dashboard state={state} stats={stats} daysLeft={daysLeft} go={setView} loadSample={() => update((s) => ({ ...s, quotes: [...s.quotes, ...sampleQuotes().filter((q) => !s.quotes.some((x) => x.email === q.email))] }))} />
          )}
          {view === "quotes" && <QuotesView state={state} update={update} />}
          {view === "campaign" && <CampaignView state={state} update={update} go={setView} />}
          {view === "send" && <SendView state={state} update={update} />}
          {view === "replies" && <RepliesView state={state} update={update} />}
          {view === "settings" && <SettingsView state={state} update={update} setState={setState} />}
        </main>
      )}

      <footer>
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span className="small muted">QuoteRevive — follow up the quotes you already sent.</span>
          <span className="small muted">Only ever email people who asked you for a quote. Always honour opt-outs.</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ state, stats, daysLeft, go, loadSample }: {
  state: AppState;
  stats: ReturnType<typeof computeStats>;
  daysLeft: number;
  go: (v: View) => void;
  loadSample: () => void;
}) {
  return (
    <div>
      <h2>Welcome back, {state.account.name.split(" ")[0]}</h2>
      <p className="muted">{state.profile.businessName} · {state.profile.trade} · Free trial: {daysLeft} day{daysLeft === 1 ? "" : "s"} remaining of 30. After your free month, QuoteRevive will be $10/month — no card required now.</p>
      <div className="grid c4" style={{ marginTop: 8 }}>
        <div className="card"><p className="muted" style={{ marginBottom: 2 }}>Dead quotes tracked</p><div className="stat-num">{stats.totalQuotes}</div><p className="small muted">{money(stats.idleValue)} still open</p></div>
        <div className="card"><p className="muted" style={{ marginBottom: 2 }}>Follow-ups sent</p><div className="stat-num">{stats.touchesSent}</div><p className="small muted">{stats.touchesPending} scheduled</p></div>
        <div className="card"><p className="muted" style={{ marginBottom: 2 }}>Replies</p><div className="stat-num">{stats.replies}</div><p className="small muted">customers who answered</p></div>
        <div className="card" style={{ background: "var(--accent-soft)" }}><p className="muted" style={{ marginBottom: 2 }}>Revived revenue</p><div className="stat-num">{money(stats.revivedValue)}</div><p className="small muted">{stats.booked} job{stats.booked === 1 ? "" : "s"} booked</p></div>
      </div>

      {state.quotes.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Start in 2 minutes</h3>
          <p className="muted">You have no quotes yet. Load the sample quotes to see exactly how QuoteRevive works, or import your own from the Quotes tab.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={loadSample}>Load sample quotes</button>
            <button className="btn ghost" onClick={() => go("quotes")}>Import my own quotes</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Next steps</h3>
          <p className="muted">1. Review your quotes. 2. Check the email templates in Campaign. 3. Launch, then send due follow-ups from the Send Center — each one opens pre-written in your Gmail.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => go("campaign")}>Go to Campaign</button>
            <button className="btn ghost" onClick={() => go("send")}>Open Send Center</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Quotes ---------------- */
function QuotesView({ state, update }: { state: AppState; update: (fn: (s: AppState) => AppState) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [report, setReport] = useState<ImportReport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const visible = state.quotes.filter((q) =>
    (filter === "All" || q.status === filter) &&
    (q.name + " " + q.email + " " + q.jobType).toLowerCase().includes(search.toLowerCase())
  );

  function addQuote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const q: Quote = {
      id: uid(),
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      amount: Number(fd.get("amount") || 0),
      date: String(fd.get("date") || todayISO()),
      jobType: String(fd.get("jobType") || "").trim() || "Project",
      status: "New",
      reply: "",
    };
    if (!q.name || !q.email) return;
    update((s) => ({ ...s, quotes: [q, ...s.quotes] }));
    form.reset();
  }

  function onCSV(file: File) {
    file.text().then((text) => {
      const rep = importQuotesFromCSV(text, state.quotes);
      setReport(rep);
      if (rep.added.length) update((s) => ({ ...s, quotes: [...rep.added, ...s.quotes] }));
    });
  }

  function downloadTemplate() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "quoterevive-sample.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function setStatus(q: Quote, status: QuoteStatus) {
    update((s) => {
      let touches = s.touches;
      let quotes = s.quotes.map((x) => (x.id === q.id ? { ...x, status, reply: status === "Replied" ? (x.reply || "New") as ReplyStatus : status === "Booked" ? "Booked" as ReplyStatus : x.reply } : x));
      if (status === "Replied" || status === "Booked" || status === "Dead") touches = cancelPendingTouches(touches, q.id);
      return { ...s, quotes, touches };
    });
  }

  return (
    <div>
      <h2>Your dead quotes ({state.quotes.length})</h2>
      <div className="grid c2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3>Import from CSV</h3>
          <p className="small muted">Columns: name, email, amount, quote date, job type. Exports from Jobber / QuickBooks work — headers are matched flexibly. Duplicates (same email) and bad rows are flagged, never silently dropped.</p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onCSV(f); e.target.value = ""; }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => fileRef.current?.click()}>Upload CSV</button>
            <button className="btn grey" onClick={downloadTemplate}>Download sample CSV</button>
          </div>
          {report && (
            <div className="ok" style={{ marginTop: 14 }}>
              <strong>Import report:</strong> {report.added.length} added · {report.duplicates} duplicate{report.duplicates === 1 ? "" : "s"} skipped · {report.badRows.length} bad row{report.badRows.length === 1 ? "" : "s"}
              {report.badRows.length > 0 && (
                <ul className="small" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                  {report.badRows.slice(0, 8).map((b, i) => <li key={i}>Row {b.row}: {b.reason}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="card">
          <h3>Add one quote manually</h3>
          <form onSubmit={addQuote}>
            <label>Customer name</label>
            <input name="name" type="text" required />
            <label>Customer email</label>
            <input name="email" type="email" required />
            <div className="grid c2">
              <div><label>Quote amount ($)</label><input name="amount" type="number" min={0} step="any" /></div>
              <div><label>Quote date</label><input name="date" type="date" defaultValue={todayISO()} /></div>
            </div>
            <label>Job type</label>
            <input name="jobType" type="text" placeholder="e.g. Kitchen remodel" />
            <button className="btn" style={{ marginTop: 14 }} type="submit">Add quote</button>
          </form>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        <input type="text" placeholder="Search name, email, job…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: "1 1 220px" }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ flex: "0 1 200px" }}>
          {["All", "New", "In sequence", "Replied", "Booked", "Dead"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card table-scroll" style={{ marginTop: 12, padding: 10 }}>
        <table>
          <thead><tr><th>Customer</th><th>Job</th><th>Amount</th><th>Quoted</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {visible.map((q) => (
              <tr key={q.id}>
                <td><strong>{q.name}</strong><br /><span className="small muted">{q.email}</span></td>
                <td>{q.jobType}</td>
                <td>{money(q.amount)}</td>
                <td>{q.date}</td>
                <td>
                  <select value={q.status} onChange={(e) => setStatus(q, e.target.value as QuoteStatus)} style={{ width: "auto", padding: "5px 8px" }}>
                    {["New", "In sequence", "Replied", "Booked", "Dead"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td><button className="btn small grey" onClick={() => update((s) => ({ ...s, quotes: s.quotes.filter((x) => x.id !== q.id), touches: s.touches.filter((t) => t.quoteId !== q.id) }))}>Delete</button></td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td colSpan={6} className="muted">No quotes match. Import a CSV or add one above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Campaign ---------------- */
function CampaignView({ state, update, go }: { state: AppState; update: (fn: (s: AppState) => AppState) => void; go: (v: View) => void }) {
  const [msg, setMsg] = useState("");
  const newCount = state.quotes.filter((q) => q.status === "New").length;

  function editTemplate(idx: number, field: "subject" | "body", value: string) {
    update((s) => ({ ...s, templates: s.templates.map((t, i) => (i === idx ? { ...t, [field]: value } : t)) }));
  }

  function launch() {
    const res = launchCampaign(state.quotes, state.touches, todayISO());
    update(() => ({ ...state, quotes: res.quotes, touches: res.touches }));
    setMsg(res.launched > 0 ? `Campaign launched for ${res.launched} quote${res.launched === 1 ? "" : "s"}. ${res.launched * 4} follow-ups are now scheduled — open the Send Center to send today's batch.` : "No new quotes to launch. Add or import quotes with status \u201cNew\u201d first.");
  }

  const previewQuote = state.quotes[0];

  return (
    <div>
      <h2>Campaign — the 4-touch sequence</h2>
      <p className="muted" style={{ maxWidth: 720 }}>Edit the emails in your own voice. Placeholders: {"{first_name}"} {"{business_name}"} {"{job_type}"} {"{amount}"} {"{owner_name}"} {"{booking_link}"}. The sequence stops automatically for anyone who replies or books.</p>
      <div className="grid" style={{ gap: 14 }}>
        {state.templates.map((t, i) => (
          <div className="card" key={t.day}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div className="seqdot">{i + 1}</div>
              <strong>Touch {i + 1} — sends on day {t.day} after launch</strong>
            </div>
            <label>Subject</label>
            <input type="text" value={t.subject} onChange={(e) => editTemplate(i, "subject", e.target.value)} />
            <label>Email body</label>
            <textarea value={t.body} onChange={(e) => editTemplate(i, "body", e.target.value)} style={{ minHeight: 150 }} />
            {previewQuote && (
              <details style={{ marginTop: 10 }}>
                <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>Preview for {previewQuote.name}</summary>
                <div className="small" style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 8, padding: 12, marginTop: 8, whiteSpace: "pre-line" }}>
                  <strong>{renderTemplate(t.subject, previewQuote, state.profile)}</strong>{"\n\n"}{renderTemplate(t.body, previewQuote, state.profile)}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div><strong>{newCount} quote{newCount === 1 ? "" : "s"} ready</strong><div className="small muted">Launching schedules 4 touches per quote: today, +3, +10 and +25 days.</div></div>
        <button className="btn" onClick={launch} disabled={newCount === 0}>Launch campaign</button>
      </div>
      {msg && <div className="ok" style={{ marginTop: 14 }}>{msg} {msg.includes("launched") && <button className="btn small" style={{ marginLeft: 10 }} onClick={() => go("send")}>Open Send Center</button>}</div>}
    </div>
  );
}

/* ---------------- Send Center ---------------- */
function SendView({ state, update }: { state: AppState; update: (fn: (s: AppState) => AppState) => void }) {
  const [copied, setCopied] = useState("");
  const today = todayISO();
  const queue = state.touches
    .filter((t) => t.status !== "cancelled")
    .sort((a, b) => (a.dueDate + a.id).localeCompare(b.dueDate + b.id));
  const due = queue.filter((t) => t.status === "pending" && t.dueDate <= today);
  const upcoming = queue.filter((t) => t.status === "pending" && t.dueDate > today);
  const sent = queue.filter((t) => t.status === "sent");

  function quoteOf(t: Touch) { return state.quotes.find((q) => q.id === t.quoteId); }

  function copyEmail(t: Touch) {
    const q = quoteOf(t); if (!q) return;
    const tpl = state.templates[t.touchIndex];
    const text = `Subject: ${renderTemplate(tpl.subject, q, state.profile)}\n\n${renderTemplate(tpl.body, q, state.profile)}`;
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { setCopied(t.id); setTimeout(() => setCopied(""), 2000); });
  }

  function row(t: Touch, showActions: boolean) {
    const q = quoteOf(t); if (!q) return null;
    const tpl = state.templates[t.touchIndex];
    const subject = renderTemplate(tpl.subject, q, state.profile);
    const body = renderTemplate(tpl.body, q, state.profile);
    const overdue = t.status === "pending" && t.dueDate < today;
    return (
      <tr key={t.id}>
        <td><strong>{q.name}</strong><br /><span className="small muted">{q.email}</span></td>
        <td>Touch {t.touchIndex + 1} of 4<br /><span className="small muted">{q.jobType} · {money(q.amount)}</span></td>
        <td>{t.dueDate}{overdue && <span className="tag warn" style={{ marginLeft: 6 }}>overdue</span>}{t.status === "sent" && <span className="tag" style={{ marginLeft: 6 }}>sent {t.sentAt}</span>}</td>
        <td className="small" style={{ maxWidth: 260 }}>{subject}</td>
        <td>
          {showActions ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a className="btn small" target="_blank" rel="noreferrer" href={gmailComposeUrl(q.email, subject, body)}>Open in Gmail</a>
              <button className="btn small grey" onClick={() => copyEmail(t)}>{copied === t.id ? "Copied ✓" : "Copy email"}</button>
              <button className="btn small ghost" onClick={() => update((s) => ({ ...s, touches: markTouchSent(s.touches, t.id, todayISO()) }))}>Mark sent</button>
            </div>
          ) : <span className="small muted">{t.status}</span>}
        </td>
      </tr>
    );
  }

  return (
    <div>
      <h2>Send Center</h2>
      <p className="muted" style={{ maxWidth: 720 }}>QuoteRevive sends from <strong>your own Gmail</strong> — better delivery, and it costs nothing. Click “Open in Gmail”, check the pre-written email, press send in Gmail, then come back and mark it sent.</p>
      <h3 style={{ marginTop: 18 }}>Due now ({due.length})</h3>
      <div className="card table-scroll" style={{ padding: 10 }}>
        <table><thead><tr><th>Customer</th><th>Touch</th><th>Due</th><th>Subject</th><th>Actions</th></tr></thead>
          <tbody>{due.map((t) => row(t, true))}{due.length === 0 && <tr><td colSpan={5} className="muted">Nothing due. Launch a campaign, or wait for the next touch date.</td></tr>}</tbody></table>
      </div>
      <h3 style={{ marginTop: 22 }}>Upcoming ({upcoming.length})</h3>
      <div className="card table-scroll" style={{ padding: 10 }}>
        <table><thead><tr><th>Customer</th><th>Touch</th><th>Due</th><th>Subject</th><th></th></tr></thead>
          <tbody>{upcoming.map((t) => row(t, false))}{upcoming.length === 0 && <tr><td colSpan={5} className="muted">No upcoming touches scheduled.</td></tr>}</tbody></table>
      </div>
      <h3 style={{ marginTop: 22 }}>Sent ({sent.length})</h3>
      <div className="card table-scroll" style={{ padding: 10 }}>
        <table><thead><tr><th>Customer</th><th>Touch</th><th>Sent</th><th>Subject</th><th></th></tr></thead>
          <tbody>{sent.map((t) => row(t, false))}{sent.length === 0 && <tr><td colSpan={5} className="muted">Nothing sent yet.</td></tr>}</tbody></table>
      </div>
    </div>
  );
}

/* ---------------- Reply Board ---------------- */
function RepliesView({ state, update }: { state: AppState; update: (fn: (s: AppState) => AppState) => void }) {
  const replied = state.quotes.filter((q) => q.reply !== "" || q.status === "Replied" || q.status === "Booked");
  const inSeq = state.quotes.filter((q) => q.status === "In sequence" && q.reply === "");
  const revived = replied.filter((q) => q.reply === "Booked" || q.status === "Booked").reduce((s, q) => s + q.amount, 0);

  function setReply(q: Quote, reply: ReplyStatus) {
    update((s) => {
      const quotes = s.quotes.map((x) => x.id === q.id ? {
        ...x, reply,
        status: reply === "Booked" ? "Booked" as QuoteStatus : reply === "" ? x.status : "Replied" as QuoteStatus,
      } : x);
      const touches = reply !== "" ? cancelPendingTouches(s.touches, q.id) : s.touches;
      return { ...s, quotes, touches };
    });
  }

  return (
    <div>
      <h2>Reply Board</h2>
      <p className="muted">When a customer replies to a follow-up, mark it here — the rest of their sequence stops automatically. Booked jobs add to your revived revenue: <strong>{money(revived)}</strong></p>
      {inSeq.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Waiting for replies ({inSeq.length})</h3>
          <p className="small muted">Got a reply from one of these customers? Mark it:</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {inSeq.map((q) => <button key={q.id} className="btn small grey" onClick={() => setReply(q, "New")}>{q.name} replied</button>)}
          </div>
        </div>
      )}
      <div className="card table-scroll" style={{ padding: 10 }}>
        <table>
          <thead><tr><th>Customer</th><th>Job</th><th>Amount</th><th>Reply status</th></tr></thead>
          <tbody>
            {replied.map((q) => (
              <tr key={q.id}>
                <td><strong>{q.name}</strong><br /><span className="small muted">{q.email}</span></td>
                <td>{q.jobType}</td>
                <td>{money(q.amount)}</td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(["New", "Interested", "Not now", "Booked"] as ReplyStatus[]).map((r) => (
                      <button key={r} className={`btn small ${q.reply === r ? "" : "grey"}`} onClick={() => setReply(q, r)}>{r}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {replied.length === 0 && <tr><td colSpan={4} className="muted">No replies yet. When a customer answers a follow-up, mark them above or in the Quotes tab.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function SettingsView({ state, update, setState }: { state: AppState; update: (fn: (s: AppState) => AppState) => void; setState: (s: AppState | null) => void }) {
  const [saved, setSaved] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    update((s) => ({
      ...s,
      profile: {
        businessName: String(fd.get("businessName") || ""),
        ownerName: String(fd.get("ownerName") || ""),
        replyEmail: String(fd.get("replyEmail") || ""),
        bookingLink: String(fd.get("bookingLink") || ""),
        trade: String(fd.get("trade") || s.profile.trade),
      },
    }));
    setSaved("Profile saved ✓");
    setTimeout(() => setSaved(""), 2500);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "quoterevive-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importBackup(file: File) {
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.account && Array.isArray(parsed.quotes)) setState(parsed);
        else alert("That file does not look like a QuoteRevive backup.");
      } catch { alert("Could not read that backup file."); }
    });
  }

  return (
    <div>
      <h2>Settings</h2>
      <div className="grid c2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3>Business profile</h3>
          <p className="small muted">Used in every follow-up email: {"{business_name}"}, {"{owner_name}"} and {"{booking_link}"}.</p>
          <form onSubmit={saveProfile}>
            <label>Business name</label>
            <input name="businessName" type="text" defaultValue={state.profile.businessName} />
            <label>Your name (sign-off)</label>
            <input name="ownerName" type="text" defaultValue={state.profile.ownerName} />
            <label>Reply-to email</label>
            <input name="replyEmail" type="email" defaultValue={state.profile.replyEmail} />
            <label>Booking link (Calendly etc.)</label>
            <input name="bookingLink" type="url" placeholder="https://calendly.com/…" defaultValue={state.profile.bookingLink} />
            <label>Trade</label>
            <select name="trade" defaultValue={state.profile.trade}>{TRADES.map((t) => <option key={t}>{t}</option>)}</select>
            <button className="btn" style={{ marginTop: 14 }} type="submit">Save profile</button>
            {saved && <span className="small" style={{ marginLeft: 10 }}>{saved}</span>}
          </form>
        </div>
        <div className="card">
          <h3>Your data & backup</h3>
          <p className="small muted">Testing build: your account, quotes and campaigns are stored in this browser on this device only — nothing is uploaded anywhere. Download a backup before switching devices or clearing browser data.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={exportBackup}>Download backup (JSON)</button>
            <button className="btn grey" onClick={() => importRef.current?.click()}>Restore backup</button>
            <input ref={importRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ""; }} />
          </div>
          <h3 style={{ marginTop: 22 }}>Plan</h3>
          <p className="small muted">Free trial: 30 days from sign-up ({trialDaysRemaining(state.account.createdAt)} days left). After your free month, QuoteRevive will be $10/month — no card required now, and paid plans are not switched on during testing.</p>
          <h3 style={{ marginTop: 22 }}>Danger zone</h3>
          <button className="btn grey" onClick={() => { if (confirm("Delete ALL QuoteRevive data on this device? Download a backup first if you need it.")) { localStorage.removeItem(LS_KEY); setState(null); } }}>Delete all my data on this device</button>
        </div>
      </div>
    </div>
  );
}
