# QuoteRevive

**Revive your dead quotes.** A follow-up tool for home-service contractors (remodeling, HVAC, roofing, painting, landscaping). Contractors import old unsold quotes, QuoteRevive runs a polite 4-touch email follow-up sequence (Day 0 / 3 / 10 / 25), and every reply is tracked on one board — so quotes already sent can still turn into booked jobs.

## Pricing (Finn's decision, 2026-11-16)

- **Testing phase: no pricing, no payment collection, no paywall.**
- Every account gets a **1-month free trial (30 days from sign-up)**, shown as a countdown in the app.
- After the trial the plan will be **$10/month** — this is shown honestly in the app ("no card required now"). Nothing is charged in this build.

## What works in this build

- Public landing page with a working Dead Quote Calculator (unsold quotes × average job value × revival %).
- Local sign-up / log-in (name, business, trade, email, password) + one-click demo account with 12 sample dead quotes.
- Business profile settings (business name, owner name, reply-to email, booking link) used as email placeholders.
- CSV import with flexible header matching (Jobber / QuickBooks style exports), email validation, duplicate detection and a clear import report; downloadable sample CSV template; manual add-quote form.
- Quotes list with search, status filter, status changes and delete.
- Campaign builder: 4 editable email templates with `{first_name} {business_name} {job_type} {amount} {owner_name} {booking_link}` placeholders and per-quote preview.
- Launch campaign → per-quote send queue with due dates (today, +3, +10, +25 days). **Stop-on-reply:** marking a quote Replied / Booked / Dead cancels its remaining touches.
- Send Center: due / upcoming / sent lists. Each due touch can be **opened pre-written in your own Gmail** (Gmail compose link), copied, and marked sent. Sending from the owner's own Gmail = $0 cost and better deliverability.
- Reply Board: mark replies New / Interested / Not now / Booked; booked jobs total into **revived revenue**.
- Dashboard stats: quotes tracked, idle $, follow-ups sent/scheduled, replies, booked jobs, revived $, trial days remaining.
- Backup: export/import all data as JSON.

## Testing-phase limitation (honest)

This build stores the account and all data **in the browser's localStorage on one device** — there is no cloud backend yet, and the app says so in the sign-up and Settings areas. Do not treat this as the public-launch architecture.

**Trial behaviour during testing:** after day 30 the app shows a "trial ended — $10/month coming soon" notice but does **not** hard-block any feature, because paid plans are not switched on yet.

## Phase 2 path

1. Supabase accounts + database (replace localStorage) so data follows the user across devices.
2. Gmail OAuth auto-sending (replace the manual "Open in Gmail + Mark sent" step) with the same stop-on-reply engine.
3. Polar or Lemon Squeezy checkout for the $10/month plan (merchant-of-record that pays out to Pakistan; only takes a cut on sales).
4. Optional: Jobber/QuickBooks API import (CSV first, by design), SMS touches via the user's own Twilio key.

## Tech

Next.js 15 (App Router) + React 19 + TypeScript. Core sequence/CSV/stats logic lives in `app/lib.ts` as pure functions (unit-tested: CSV import incl. duplicates/bad rows/money & US-date parsing, campaign queue dates, Gmail compose URL rendering, stop-on-reply, revived-$ stats, trial countdown — 36/36 checks passing at build time).

## Run locally

```bash
npm install
npm run build
npm run start
```
