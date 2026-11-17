"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AppState, Quote, Template, Touch, QuoteStatus, ReplyStatus,
  defaultTemplates, sampleQuotes, launchCampaign, cancelPendingTouches, markTouchSent,
  computeStats, importQuotesFromCSV, ImportReport, SAMPLE_CSV, renderTemplate,
  gmailComposeUrl, trialDaysRemaining, money, todayISO, addDays, uid,
  validateSignup, validateLogin,
} from "./lib";

const LS_KEY = "quoterevive_v1";
const LS_REPLY_KEY = "quoterevive_replylog_v1";
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
  const quotes = sampleQuotes();
  const touches: Touch[] = [];
  const today = todayISO();
  const launch = addDays(today, -13); // demo campaign launched 13 days ago
  const mk = (q: Quote, idx: number, due: string, status: Touch["status"], sentAt?: string): Touch => ({
    id: "demo-t-" + q.id + "-" + idx,
    quoteId: q.id,
    touchIndex: idx,
    dayOffset: [0, 3, 10, 25][idx],
    dueDate: due,
    status,
    ...(sentAt ? { sentAt } : {}),
  });
  // Six quotes mid-sequence: touches 1-2 sent, touch 3 due, touch 4 scheduled.
  [0, 1, 3, 4, 6, 7].forEach((qi) => {
    const q = quotes[qi];
    q.status = "In sequence";
    touches.push(
      mk(q, 0, launch, "sent", launch),
      mk(q, 1, addDays(launch, 3), "sent", addDays(launch, qi >= 6 ? 4 : 3)),
      mk(q, 2, addDays(launch, 10), "pending"),
      mk(q, 3, addDays(launch, 25), "pending")
    );
  });
  // David Garcia booked after touch 2 - the rest of his sequence stopped.
  const booked = quotes[2];
  booked.status = "Booked";
  booked.reply = "Booked";
  touches.push(
    mk(booked, 0, launch, "sent", launch),
    mk(booked, 1, addDays(launch, 3), "sent", addDays(launch, 3)),
    mk(booked, 2, addDays(launch, 10), "cancelled"),
    mk(booked, 3, addDays(launch, 25), "cancelled")
  );
  // Jessica Davis replied "Interested" - her sequence stopped too.
  const replied = quotes[5];
  replied.status = "Replied";
  replied.reply = "Interested";
  touches.push(
    mk(replied, 0, launch, "sent", launch),
    mk(replied, 1, addDays(launch, 3), "sent", addDays(launch, 3)),
    mk(replied, 2, addDays(launch, 10), "cancelled"),
    mk(replied, 3, addDays(launch, 25), "cancelled")
  );
  s.quotes = quotes;
  s.touches = touches;
  return s;
}

/** Demo reply dates for the dashboard activity chart (quote id -> ISO date). */
function demoReplyLog(): Record<string, string> {
  const today = todayISO();
  return { "sample-3": addDays(today, -8), "sample-6": addDays(today, -4) };
}

/* ---- small display helpers for the app area ---- */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function avatarClass(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return "av" + ((h % 6) + 1);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDay(iso: string): string {
  const parts = iso.split("-").map(Number);
  return MONTHS[parts[1] - 1] + " " + parts[2];
}

function fmtFull(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function dueLabel(due: string, today: string): { text: string; overdue: boolean } {
  const diff = Math.round((new Date(due + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000);
  if (diff < 0) return { text: "Overdue", overdue: true };
  if (diff === 0) return { text: "Today", overdue: false };
  if (diff === 1) return { text: "Tomorrow", overdue: false };
  return { text: fmtDay(due), overdue: false };
}

type View = "dashboard" | "quotes" | "campaign" | "send" | "replies" | "settings";

/* Rich range slider: filled track, floating value bubble, step ticks, min/max scale.
   Presentation only — same value/onChange contract as a plain range input. */
function RichSlider({ label, value, min, max, ticks, format, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  ticks: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="rslider-block">
      <span className="rslider-label">{label}</span>
      <div className="rslider">
        <div className="rslider-bubble" style={{ left: `calc(${pct}% + ${(50 - pct) * 0.24}px)` }}>{format(value)}</div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ background: `linear-gradient(90deg, var(--accent) ${pct}%, #e8e5db ${pct}%)` }}
        />
        <div className="rslider-ticks" aria-hidden="true">
          {Array.from({ length: ticks }).map((_, i) => <span key={i}></span>)}
        </div>
        <div className="rslider-scale"><span>{format(min)}</span><span>{format(max)}</span></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [authError, setAuthError] = useState("");
  const [session, setSession] = useState(false);
  const [replyLog, setReplyLog] = useState<Record<string, string>>({});

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
      const log = localStorage.getItem(LS_REPLY_KEY);
      if (log) setReplyLog(JSON.parse(log));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded && state) localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state, loaded]);

  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem(LS_REPLY_KEY, JSON.stringify(replyLog)); } catch { /* ignore */ }
    }
  }, [replyLog, loaded]);

  const stats = useMemo(() => (state ? computeStats(state.quotes, state.touches) : null), [state]);
  const daysLeft = state ? trialDaysRemaining(state.account.createdAt) : 0;
  const dueCount = state ? state.touches.filter((t) => t.status === "pending" && t.dueDate <= todayISO()).length : 0;

  /** Record (or clear) the date a quote's reply was marked, for the activity chart. */
  function noteReply(quoteId: string, active: boolean) {
    setReplyLog((prev) => {
      if (active) {
        const today = todayISO();
        return prev[quoteId] === today ? prev : { ...prev, [quoteId]: today };
      }
      if (!(quoteId in prev)) return prev;
      const next = { ...prev };
      delete next[quoteId];
      return next;
    });
  }

  function update(fn: (s: AppState) => AppState) {
    setState((prev) => (prev ? fn(prev) : prev));
  }

  function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name") || ""),
      businessName: String(fd.get("business") || ""),
      trade: String(fd.get("trade") || "Remodeling"),
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
    };
    const err = validateSignup(input, state ? state.account : null);
    if (err) { setAuthError(err); return; }
    setAuthError("");
    setState(blankState(input.name.trim(), input.businessName.trim(), input.trade, input.email.trim(), input.password));
    setSession(true);
    setView("dashboard");
  }

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const err = validateLogin(email, password, state ? state.account : null);
    if (err) { setAuthError(err); return; }
    setAuthError("");
    setSession(true);
    setView("dashboard");
  }

  function goAuth(mode: "signup" | "login") {
    setAuthMode(mode);
    setAuthError("");
    requestAnimationFrame(() => {
      document.getElementById("get-started")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function logout() {
    // Data stays saved on this device; logging in again restores it.
    setSession(false);
  }


  /* ---- Logged-in app shell: navy icon sidebar + white top bar (Finn's reference) ---- */
  if (state && session && stats) {
    const titles: Record<View, string> = {
      dashboard: "Dashboard", quotes: "Quotes", campaign: "Campaign",
      send: "Send Center", replies: "Reply Board", settings: "Settings",
    };
    const navItems: Array<{ v: View; label: string; icon: React.ReactNode }> = [
      { v: "dashboard", label: "Dashboard", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 9.8V20h13V9.8" /></svg>) },
      { v: "quotes", label: "Quotes", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M9.8 12.5h4.9" /><path d="M9.8 16.5h4.9" /></svg>) },
      { v: "campaign", label: "Campaign", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13.5 9 5 9-5" /></svg>) },
      { v: "send", label: "Send Center", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3 10.5 13.5" /><path d="M21 3 14 21l-3.5-7.5L3 10 21 3z" /></svg>) },
      { v: "replies", label: "Reply Board", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4l2.2-3.1A8 8 0 1 1 21 12z" /><path d="M8.5 11h7" /><path d="M8.5 14h4" /></svg>) },
      { v: "settings", label: "Settings", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2" /><path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></svg>) },
    ];
    return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="side-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="#fff"><path d="M13 2 4.5 13.5H11L9.8 22l8.7-11.5H12L13 2z" /></svg>
          </div>
          <nav className="side-nav" aria-label="App sections">
            {navItems.map((item) => (
              <button key={item.v} type="button" className={"side-btn" + (view === item.v ? " active" : "")} onClick={() => setView(item.v)} aria-label={item.label} title={item.label}>
                {item.icon}
                {item.v === "send" && dueCount > 0 && <span className="side-badge">{dueCount}</span>}
              </button>
            ))}
          </nav>
          <div className="side-avatar" title={state.profile.businessName}>{initialsOf(state.profile.businessName)}</div>
        </aside>
        <div className="app-main">
          <header className="app-topbar">
            <span className="app-title">{titles[view]}</span>
            <div className="app-top-right">
              <span className="tag">{daysLeft > 0 ? "Free trial · " + daysLeft + " of 30 days left" : "Free trial ended"}</span>
              <span className="app-biz">{state.profile.businessName}</span>
              <button className="btn small grey" onClick={logout}>Log out</button>
            </div>
          </header>
          <main className="app-content">
            {daysLeft <= 0 && (
              <div className="notice" style={{ marginBottom: 18 }}>
                <strong>Your free month has ended.</strong> QuoteRevive will be $10/month — paid plans are not switched on yet during testing, so you can keep using everything.
              </div>
            )}
            {view === "dashboard" && (
              <Dashboard state={state} stats={stats} dueCount={dueCount} replyLog={replyLog} go={setView} loadSample={() => update((s) => ({ ...s, quotes: [...s.quotes, ...sampleQuotes().filter((q) => !s.quotes.some((x) => x.email === q.email))] }))} />
            )}
            {view === "quotes" && <QuotesView state={state} update={update} noteReply={noteReply} />}
            {view === "campaign" && <CampaignView state={state} update={update} go={setView} />}
            {view === "send" && <SendView state={state} update={update} />}
            {view === "replies" && <RepliesView state={state} update={update} noteReply={noteReply} />}
            {view === "settings" && <SettingsView state={state} update={update} setState={setState} />}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar">
        <div className="wrap">
          <a className="logo" href="#" onClick={(e) => e.preventDefault()}>Quote<span>Revive</span></a>
          <nav className="nav-auth" aria-label="Account">
            <button className="btn small ghost" onClick={() => goAuth("login")}>Log in</button>
            <button className="btn small" onClick={() => goAuth("signup")}>Start free month</button>
          </nav>
        </div>
      </div>

      <main>
          <div className="hero">
            <div className="wrap">
              <span className="tag rise">1 month free for every new account — no card required</span>
              <h1 className="rise rise-1" style={{ marginTop: 20 }}>
                Dead quotes are{" "}
                <span className="chip-icon ci-blue" aria-hidden="true"><svg viewBox="0 0 24 24" fill="#fff"><path d="M13 2 4.5 13.5H11L9.8 22l8.7-11.5H12L13 2z" /></svg></span>{" "}
                <span className="hl">money</span> <span className="hg">on the table.</span><br />
                We pick it up{" "}
                <span className="chip-icon sq ci-pink" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19 19 4" /><path d="M9 4h10v10" /></svg></span>{" "}
                for you.
              </h1>
              <p className="hero-sub rise rise-2">
                Every month you send quotes that never get a reply. QuoteRevive imports those dead quotes and runs a
                friendly 4-touch email follow-up in your voice — so work you already quoted can still turn into booked jobs.
              </p>
              <div className="rise rise-3" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
                <a className="btn lg" href="#get-started">Start my free month</a>
                <button className="btn lg ghost" onClick={() => { setState(demoState()); setReplyLog(demoReplyLog()); setSession(true); }}>Try the demo account</button>
              </div>
              <div className="hero-checks rise rise-3">
                <span>1 month free</span>
                <span>No card required</span>
                <span>Sends from your own Gmail</span>
                <span>Then $10/month — that is the whole price</span>
              </div>

              <div className="hero-visual rise rise-4">
                <div className="mock" aria-hidden="true">
                  <div className="mock-bar">
                    <span className="mock-dot o"></span><span className="mock-dot"></span><span className="mock-dot"></span>
                    <span className="mock-url">quoterevive.app/dashboard</span>
                  </div>
                  <div className="mock-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <span className="mock-title">BrightHome Renovations — this week</span>
                      <span className="tag good">Campaign running</span>
                    </div>
                    <div className="mock-stats">
                      <div className="mock-chip"><div className="k">Dead quotes tracked</div><div className="v">12</div></div>
                      <div className="mock-chip"><div className="k">Still open</div><div className="v">$80,600</div></div>
                      <div className="mock-chip"><div className="k">Revived so far</div><div className="v green">$12,500</div></div>
                    </div>
                    <div className="mock-row">
                      <div className="who"><span className="avatar av1">DG</span><div><strong>David Garcia</strong><br /><span className="small muted">Roof replacement · Touch 2 of 4 sent</span></div></div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="amt">$12,500</span><span className="pill booked">Booked</span></div>
                    </div>
                    <div className="mock-row">
                      <div className="who"><span className="avatar av2">JM</span><div><strong>James Miller</strong><br /><span className="small muted">Kitchen remodel · Touch 3 of 4 due Thursday</span></div></div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="amt">$8,400</span><span className="pill seq">In sequence</span></div>
                    </div>
                    <div className="mock-row">
                      <div className="who"><span className="avatar av3">EW</span><div><strong>Emily Wilson</strong><br /><span className="small muted">Exterior painting · Waiting for first touch</span></div></div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="amt">$1,850</span><span className="pill new">New</span></div>
                    </div>
                  </div>
                </div>
                <div className="float-card float-reply" aria-hidden="true">
                  <div className="fc-head"><span className="fc-dot"></span>Reply received</div>
                  <p className="small muted" style={{ margin: "6px 0 0" }}>“Hi — yes, we still want the roof done. Can we book for next month?” — David G.</p>
                </div>
                <div className="float-card float-booked" aria-hidden="true">
                  <div className="fc-head"><span className="fc-dot blue"></span>Job booked · $12,500</div>
                  <p className="small muted" style={{ margin: "6px 0 0" }}>From a quote sent 3 months ago — revived by touch 2.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              <span>Remodeling ✦ HVAC ✦ Roofing ✦ Painting ✦ Landscaping ✦ Plumbing ✦ Electrical ✦ Home services ✦</span>
              <span>Remodeling ✦ HVAC ✦ Roofing ✦ Painting ✦ Landscaping ✦ Plumbing ✦ Electrical ✦ Home services ✦</span>
            </div>
          </div>

          <section style={{ paddingBottom: 8 }}>
            <div className="wrap">
              <div className="facts">
                <div className="fact"><div className="n">4 touches</div><div className="l">One polite sequence, in your voice</div></div>
                <div className="fact"><div className="n">25 days</div><div className="l">Spaced out — day 0, 3, 10 and 25</div></div>
                <div className="fact"><div className="n">Your Gmail</div><div className="l">Sends from your own inbox, $0 sending cost</div></div>
                <div className="fact"><div className="n">Stops itself</div><div className="l">The moment a customer replies or books</div></div>
              </div>
            </div>
          </section>

          <section className="section-white">
            <div className="wrap">
              <div className="sec-head">
                <span className="eyebrow">How it works</span>
                <h2>From forgotten quotes to booked jobs, in three steps</h2>
              </div>
              <div className="grid c3">
                <div className="card hoverable">
                  <span className="medal md1" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 20h16" /></svg></span>
                  <span className="step-num">Step 01</span><h3>Import your dead quotes</h3><p className="muted" style={{ marginBottom: 0 }}>Upload a CSV from Jobber, QuickBooks or a spreadsheet — or add quotes one by one. Name, email, amount, job type. That is all we need.</p>
                </div>
                <div className="card hoverable">
                  <span className="medal md2" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3 10.5 13.5" /><path d="M21 3 14 21l-3.5-7.5L3 10 21 3z" /></svg></span>
                  <span className="step-num">Step 02</span><h3>Launch the sequence</h3><p className="muted" style={{ marginBottom: 0 }}>Four short, polite follow-up emails over 25 days, written in your voice and editable by you. Sending happens from your own Gmail, one click per email.</p>
                </div>
                <div className="card hoverable">
                  <span className="medal md3" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4l2.2-3.1A8 8 0 1 1 21 12z" /><path d="M8.5 11h7" /><path d="M8.5 14h4" /></svg></span>
                  <span className="step-num">Step 03</span><h3>Watch replies come in</h3><p className="muted" style={{ marginBottom: 0 }}>Every reply lands on one simple board. Mark jobs as booked and see exactly how much revenue you revived.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="section-tint">
            <div className="wrap">
              <div className="sec-head">
                <span className="eyebrow">The sequence</span>
                <h2>Four touches. Twenty-five days. Zero pestering.</h2>
                <p className="muted">Polite, spaced out, and it stops the moment a customer replies. You can edit every word before you launch.</p>
              </div>
              <div className="timeline">
                {defaultTemplates().map((t, i) => (
                  <div className="tl-item" key={t.day}>
                    <div className="seqdot">{i + 1}</div>
                    <div className="card">
                      <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>Day {t.day} — {t.subject.replace("{job_type}", "kitchen remodel")}</strong>
                      <p className="small muted" style={{ margin: "6px 0 0", whiteSpace: "pre-line" }}>{t.body.split("\n").slice(0, 3).join("\n")}…</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="section-white">
            <div className="wrap grid c2" style={{ alignItems: "start" }}>
              <div className="card">
                <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>Dead Quote Calculator</span>
                <h2 style={{ fontSize: "1.9rem" }}>How much money is sitting in your old quotes?</h2>
                <p className="muted" style={{ marginBottom: 0 }}>Move the sliders and see. Even a small revival rate can mean one or two extra jobs a month — from quotes you have already written.</p>
                <RichSlider label="Unsold quotes in the last 12 months" value={calcQuotes} min={0} max={300} ticks={7} format={(v) => `${v}`} onChange={setCalcQuotes} />
                <div style={{ marginTop: 24 }}>
                  <span className="rslider-label">Average job value</span>
                  <div className="ffield" style={{ marginTop: 8 }}>
                    <input type="number" min={0} value={calcAvg} onChange={(e) => setCalcAvg(Number(e.target.value))} placeholder=" " aria-label="Average job value in dollars" />
                    <label>Amount in $</label>
                  </div>
                </div>
                <RichSlider label="If just this % reply and book" value={calcPct} min={1} max={30} ticks={6} format={(v) => `${v}%`} onChange={setCalcPct} />
              </div>
              <div className="calc-out">
                <p className="eyebrow" style={{ marginBottom: 8 }}>Pipeline sitting idle</p>
                <div className="stat-num" data-testid="idle-value">{money(idle)}</div>
                <div className="divider"></div>
                <p className="eyebrow" style={{ marginBottom: 8 }}>Potential revived revenue at {calcPct}%</p>
                <div className="stat-num big-green" data-testid="potential-value">{money(potential)}</div>
                <p className="small muted" style={{ marginTop: 16, marginBottom: 0 }}>An estimate to show the size of the opportunity — your real results depend on your quotes and your market.</p>
              </div>
            </div>
          </section>

          <section id="get-started">
            <div className="wrap grid c2" style={{ alignItems: "start" }}>
              <div>
                <span className="eyebrow" style={{ display: "block", marginBottom: 12 }}>Get started</span>
                <h2>Your first month is on us</h2>
                <p className="muted">Every account starts with a full month free. No pricing and no card during testing — after the free month the plan will be $10/month.</p>
                <p className="small muted">Testing build note: this early version keeps your account and quotes on this device only. Cloud accounts and automatic sending arrive before the public launch.</p>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className={`btn small ${authMode === "signup" ? "" : "grey"}`} onClick={() => setAuthMode("signup")}>Sign up</button>
                  <button className={`btn small ${authMode === "login" ? "" : "grey"}`} onClick={() => setAuthMode("login")}>Log in</button>
                </div>
              </div>
              <div className="card">
                {authMode === "signup" ? (
                  <form className="pform" onSubmit={handleSignup}>
                    <div>
                      <div className="ffield">
                        <input name="name" type="text" placeholder=" " required />
                        <label>Your name</label>
                      </div>
                      <p className="fhint">e.g. Mike Carter</p>
                    </div>
                    <div>
                      <div className="ffield">
                        <input name="business" type="text" placeholder=" " required />
                        <label>Business name</label>
                      </div>
                      <p className="fhint">e.g. Carter Remodeling LLC</p>
                    </div>
                    <div className="sfield">
                      <label>Trade</label>
                      <select name="trade">{TRADES.map((t) => <option key={t}>{t}</option>)}</select>
                    </div>
                    <div>
                      <div className="ffield">
                        <input name="email" type="email" placeholder=" " required />
                        <label>Email</label>
                      </div>
                      <p className="fhint">you@yourbusiness.com — where replies and reports would go.</p>
                    </div>
                    <div>
                      <div className="ffield">
                        <input name="password" type="password" placeholder=" " required />
                        <label>Password</label>
                      </div>
                      <p className="fhint">At least 4 characters.</p>
                    </div>
                    {authError && <p className="form-error">{authError}</p>}
                    <button className="btn" style={{ width: "100%" }} type="submit">Create my free account</button>
                  </form>
                ) : (
                  <form className="pform" onSubmit={handleLogin}>
                    <div className="ffield">
                      <input name="email" type="email" placeholder=" " required />
                      <label>Email</label>
                    </div>
                    <div className="ffield">
                      <input name="password" type="password" placeholder=" " required />
                      <label>Password</label>
                    </div>
                    {authError && <p className="form-error">{authError}</p>}
                    <button className="btn" style={{ width: "100%" }} type="submit">Log in</button>
                    <p className="small muted" style={{ marginBottom: 0 }}>Accounts live on this device in this testing build. No account here yet? Sign up or try the demo.</p>
                  </form>
                )}
                <button className="btn ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => { setState(demoState()); setReplyLog(demoReplyLog()); setSession(true); }}>Load the demo account with sample quotes</button>
              </div>
            </div>
          </section>
        </main>
      <footer>
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <span className="logo">Quote<span>Revive</span></span>
          <span className="small muted">Follow up the quotes you already sent.</span>
          <span className="small muted">Only ever email people who asked you for a quote. Always honour opt-outs.</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ state, stats, dueCount, replyLog, go, loadSample }: {
  state: AppState;
  stats: ReturnType<typeof computeStats>;
  dueCount: number;
  replyLog: Record<string, string>;
  go: (v: View) => void;
  loadSample: () => void;
}) {
  const newCount = state.quotes.filter((q) => q.status === "New").length;
  const datePill = new Date(todayISO() + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <div>
      <section className="card stat-strip">
        <div className="strip-head">
          <span className="strip-title">Overview</span>
          <span className="strip-date">{datePill}</span>
        </div>
        <div className="strip-grid">
          <div className="strip-stat">
            <div className="strip-top">
              <span className="strip-chip c-azure"><svg {...iconProps}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /><path d="M9.8 12.5h4.9" /><path d="M9.8 16.5h4.9" /></svg></span>
              <span className="strip-label">Quotes tracked</span>
            </div>
            <div className="strip-num">{stats.totalQuotes}</div>
            <p className="strip-sub">{newCount} awaiting launch</p>
          </div>
          <div className="strip-stat">
            <div className="strip-top">
              <span className="strip-chip c-amber"><svg {...iconProps}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg></span>
              <span className="strip-label">Idle pipeline</span>
            </div>
            <div className="strip-num">{money(stats.idleValue)}</div>
            <p className="strip-sub">Value still open</p>
          </div>
          <div className="strip-stat">
            <div className="strip-top">
              <span className="strip-chip c-violet"><svg {...iconProps}><path d="M21 3 10.5 13.5" /><path d="M21 3 14 21l-3.5-7.5L3 10 21 3z" /></svg></span>
              <span className="strip-label">Emails sent</span>
            </div>
            <div className="strip-num">{stats.touchesSent}</div>
            <p className="strip-sub">{stats.touchesPending} scheduled</p>
          </div>
          <div className="strip-stat">
            <div className="strip-top">
              <span className="strip-chip c-green"><svg {...iconProps}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 10h17" /><path d="M8 3v4M16 3v4" /><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" /></svg></span>
              <span className="strip-label">Jobs booked</span>
            </div>
            <div className="strip-num">{stats.booked}</div>
            <p className="strip-sub">{money(stats.revivedValue)} revived</p>
          </div>
        </div>
      </section>

      <div className="dash-grid">
        <ActivityChart touches={state.touches} quotes={state.quotes} replyLog={replyLog} />
        <UpcomingSends state={state} />
      </div>

      {state.quotes.length === 0 ? (
        <div className="empty" style={{ marginTop: 20 }}>
          <h3>Start in 2 minutes</h3>
          <p className="muted">Load the sample quotes to see how it works, or import your own.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={loadSample}>Load sample quotes</button>
            <button className="btn ghost" onClick={() => go("quotes")}>Import my own quotes</button>
          </div>
        </div>
      ) : dueCount > 0 ? (
        <div className="card attention">
          <span><strong>{dueCount} follow-up{dueCount === 1 ? "" : "s"} due</strong> — ready to send from your Gmail.</span>
          <button className="btn" onClick={() => go("send")}>Open Send Center</button>
        </div>
      ) : null}
    </div>
  );
}

/* Activity chart: real per-day counts from state - emails sent (touches'
   sentAt) and replies (reply dates recorded when a reply is marked). */
function ActivityChart({ touches, quotes, replyLog }: { touches: Touch[]; quotes: Quote[]; replyLog: Record<string, string> }) {
  const [hover, setHover] = useState<number | null>(null);
  const days = useMemo(() => {
    const today = todayISO();
    const repliedIds = new Set(quotes.filter((q) => q.reply !== "" || q.status === "Replied" || q.status === "Booked").map((q) => q.id));
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, i - 13);
      return {
        date,
        sent: touches.filter((t) => t.status === "sent" && t.sentAt === date).length,
        replies: Object.entries(replyLog).filter(([qid, d]) => d === date && repliedIds.has(qid)).length,
      };
    });
  }, [touches, quotes, replyLog]);

  const total = days.reduce((s, d) => s + d.sent + d.replies, 0);
  const W = 660, H = 252, PL = 36, PR = 12, PT = 14, PB = 30;
  const maxV = Math.max(4, ...days.map((d) => Math.max(d.sent, d.replies)));
  const x = (i: number) => PL + (i * (W - PL - PR)) / 13;
  const y = (v: number) => PT + (H - PT - PB) * (1 - v / maxV);
  const pts = (key: "sent" | "replies") => days.map((d, i) => x(i).toFixed(1) + "," + y(d[key]).toFixed(1)).join(" ");
  const areaPts = PL + "," + y(0) + " " + days.map((d, i) => x(i).toFixed(1) + "," + y(d.sent).toFixed(1)).join(" ") + " " + x(13) + "," + y(0);
  const gridVals = [0, 1, 2, 3].map((f) => Math.round((maxV * f) / 3));

  return (
    <section className="card chart-card">
      <div className="chart-head">
        <span className="card-title">Activity overview</span>
        <span className="strip-date">Last 14 days</span>
      </div>
      <div className="legend-row">
        <span className="legend-chip"><span className="legend-dot sent"></span>Emails sent</span>
        <span className="legend-chip"><span className="legend-dot replies"></span>Replies</span>
      </div>
      {total === 0 ? (
        <p className="muted chart-empty">No activity yet — sent emails and replies will chart here.</p>
      ) : (
        <div className="chart-wrap">
          <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Emails sent and replies over the last 14 days">
            {gridVals.map((v) => (
              <g key={v}>
                <line x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} stroke="#e9e7df" strokeWidth="1" strokeDasharray="2 4" />
                <text x={PL - 8} y={y(v) + 4} textAnchor="end" fontSize="10.5" fill="#857e6e" fontWeight="600">{v}</text>
              </g>
            ))}
            <polygon points={areaPts} fill="rgba(46,155,255,0.08)" />
            <polyline points={pts("sent")} fill="none" stroke="#2e9bff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={pts("replies")} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && (
              <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="#c9d4e2" strokeWidth="1" strokeDasharray="3 3" />
            )}
            {days.map((d, i) => (
              <g key={d.date}>
                <circle cx={x(i)} cy={y(d.sent)} r={hover === i ? 5 : 3.5} fill="#2e9bff" stroke="#fff" strokeWidth="1.6" />
                <circle cx={x(i)} cy={y(d.replies)} r={hover === i ? 5 : 3.5} fill="#8b5cf6" stroke="#fff" strokeWidth="1.6" />
                {(i % 3 === 0 || i === 13) && (
                  <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="#857e6e" fontWeight="600">{fmtDay(d.date)}</text>
                )}
                <rect x={x(i) - (W - PL - PR) / 26} y={PT} width={(W - PL - PR) / 13} height={H - PT - PB} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)} />
              </g>
            ))}
          </svg>
          {hover !== null && (
            <div className="chart-tip" style={{ left: (x(hover) / W) * 100 + "%", transform: hover <= 1 ? "translateX(-6%)" : hover >= 12 ? "translateX(-94%)" : "translateX(-50%)" }}>
              <div className="tt-title">{fmtFull(days[hover].date)}</div>
              <div className="tt-row"><span className="legend-dot sent"></span>Emails sent <b>{days[hover].sent}</b></div>
              <div className="tt-row"><span className="legend-dot replies"></span>Replies <b>{days[hover].replies}</b></div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* Next scheduled touches, styled like the reference's events list. */
function UpcomingSends({ state }: { state: AppState }) {
  const today = todayISO();
  const upcoming = state.touches
    .filter((t) => t.status === "pending")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);
  return (
    <section className="card up-card">
      <div className="chart-head"><span className="card-title">Upcoming sends</span></div>
      {upcoming.length === 0 ? (
        <p className="muted" style={{ margin: "14px 0 4px" }}>Nothing scheduled yet.</p>
      ) : (
        <div style={{ marginTop: 6 }}>
          {upcoming.map((t) => {
            const q = state.quotes.find((v) => v.id === t.quoteId);
            if (!q) return null;
            const due = dueLabel(t.dueDate, today);
            return (
              <div className="up-row" key={t.id}>
                <span className={"avatar " + avatarClass(q.name)}>{initialsOf(q.name)}</span>
                <div className="up-who"><strong>{q.name}</strong><span className="small muted">{q.jobType}</span></div>
                <div className="up-when"><strong className={due.overdue ? "due-bad" : ""}>{due.text}</strong><span className="small muted">Touch {t.touchIndex + 1} of 4</span></div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------------- Quotes ---------------- */
function QuotesView({ state, update, noteReply }: { state: AppState; update: (fn: (s: AppState) => AppState) => void; noteReply: (quoteId: string, active: boolean) => void }) {
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
    noteReply(q.id, status === "Replied" || status === "Booked");
    update((s) => {
      let touches = s.touches;
      let quotes = s.quotes.map((x) => (x.id === q.id ? { ...x, status, reply: status === "Replied" ? (x.reply || "New") as ReplyStatus : status === "Booked" ? "Booked" as ReplyStatus : x.reply } : x));
      if (status === "Replied" || status === "Booked" || status === "Dead") touches = cancelPendingTouches(touches, q.id);
      return { ...s, quotes, touches };
    });
  }

  return (
    <div>
      <div className="grid c2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3>Import from CSV</h3>
          <p className="small muted">Columns: name, email, amount, quote date, job type. Jobber and QuickBooks exports work.</p>
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
          <form className="pform" onSubmit={addQuote}>
            <div className="ffield">
              <input name="name" type="text" placeholder=" " required />
              <label>Customer name</label>
            </div>
            <div className="ffield">
              <input name="email" type="email" placeholder=" " required />
              <label>Customer email</label>
            </div>
            <div className="grid c2">
              <div className="ffield">
                <input name="amount" type="number" min={0} step="any" placeholder=" " />
                <label>Quote amount ($)</label>
              </div>
              <div className="ffield">
                <input name="date" type="date" defaultValue={todayISO()} placeholder=" " />
                <label>Quote date</label>
              </div>
            </div>
            <div>
              <div className="ffield">
                <input name="jobType" type="text" placeholder=" " />
                <label>Job type</label>
              </div>
              <p className="fhint">e.g. Kitchen remodel — used in the follow-up emails.</p>
            </div>
            <button className="btn" type="submit">Add quote</button>
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
      <p className="muted" style={{ maxWidth: 720 }}>Edit each email in your voice. Placeholders: {"{first_name}"} {"{business_name}"} {"{job_type}"} {"{amount}"} {"{owner_name}"} {"{booking_link}"} — the sequence stops on its own when someone replies.</p>
      <div className="grid seq-list" style={{ gap: 14 }}>
        {state.templates.map((t, i) => (
          <div className="card" key={t.day}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <div className="seqdot">{i + 1}</div>
              <strong>Touch {i + 1} — sends on day {t.day} after launch</strong>
            </div>
            <div className="pform">
              <div className="ffield">
                <input type="text" placeholder=" " value={t.subject} onChange={(e) => editTemplate(i, "subject", e.target.value)} />
                <label>Subject</label>
              </div>
              <div className="ffield">
                <textarea placeholder=" " value={t.body} onChange={(e) => editTemplate(i, "body", e.target.value)} style={{ minHeight: 150 }} />
                <label>Email body</label>
              </div>
            </div>
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
              <button className="btn small grey" onClick={() => copyEmail(t)}>{copied === t.id ? "Copied" : "Copy email"}</button>
              <button className="btn small ghost" onClick={() => update((s) => ({ ...s, touches: markTouchSent(s.touches, t.id, todayISO()) }))}>Mark sent</button>
            </div>
          ) : <span className="small muted">{t.status}</span>}
        </td>
      </tr>
    );
  }

  return (
    <div>
      <p className="muted" style={{ maxWidth: 720 }}>Emails open pre-written in <strong>your own Gmail</strong> — send there, then mark sent here.</p>
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
function RepliesView({ state, update, noteReply }: { state: AppState; update: (fn: (s: AppState) => AppState) => void; noteReply: (quoteId: string, active: boolean) => void }) {
  const replied = state.quotes.filter((q) => q.reply !== "" || q.status === "Replied" || q.status === "Booked");
  const inSeq = state.quotes.filter((q) => q.status === "In sequence" && q.reply === "");
  const revived = replied.filter((q) => q.reply === "Booked" || q.status === "Booked").reduce((s, q) => s + q.amount, 0);

  function setReply(q: Quote, reply: ReplyStatus) {
    noteReply(q.id, reply !== "");
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
      <p className="muted">Mark replies here — their sequence stops on its own. Revived so far: <strong>{money(revived)}</strong></p>
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
    setSaved("Profile saved");
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
      <div className="grid c2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3>Business profile</h3>
          <p className="small muted">Used in every follow-up email: {"{business_name}"}, {"{owner_name}"} and {"{booking_link}"}.</p>
          <form className="pform" onSubmit={saveProfile}>
            <div className="ffield">
              <input name="businessName" type="text" placeholder=" " defaultValue={state.profile.businessName} />
              <label>Business name</label>
            </div>
            <div className="ffield">
              <input name="ownerName" type="text" placeholder=" " defaultValue={state.profile.ownerName} />
              <label>Your name (sign-off)</label>
            </div>
            <div className="ffield">
              <input name="replyEmail" type="email" placeholder=" " defaultValue={state.profile.replyEmail} />
              <label>Reply-to email</label>
            </div>
            <div>
              <div className="ffield">
                <input name="bookingLink" type="url" placeholder=" " defaultValue={state.profile.bookingLink} />
                <label>Booking link (Calendly etc.)</label>
              </div>
              <p className="fhint">e.g. https://calendly.com/your-business — pasted into follow-ups as {"{booking_link}"}.</p>
            </div>
            <div className="sfield">
              <label>Trade</label>
              <select name="trade" defaultValue={state.profile.trade}>{TRADES.map((t) => <option key={t}>{t}</option>)}</select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button className="btn" type="submit">Save profile</button>
              {saved && <span className="form-ok">{saved}</span>}
            </div>
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
          <button className="btn grey" onClick={() => { if (confirm("Delete ALL QuoteRevive data on this device? Download a backup first if you need it.")) { localStorage.removeItem(LS_KEY); localStorage.removeItem(LS_REPLY_KEY); setState(null); } }}>Delete all my data on this device</button>
        </div>
      </div>
    </div>
  );
}
