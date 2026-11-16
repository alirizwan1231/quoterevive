# QuoteRevive Phase 2 — Supabase setup (Finn's steps)

Right now QuoteRevive is a testing build: accounts and quotes are saved only
in the visitor's own browser, on one device. Phase 2 moves accounts and data
into **Supabase** (a free cloud database) so real users can register once and
use QuoteRevive from any device.

**Your part takes about 5 minutes. Only you can do it, because the Supabase
project must live in your own account.** After that, send Jarvis two values
and Jarvis does the rest (wiring the app + re-testing).

---

## Step 1 — Create the project

1. Go to **https://supabase.com** and sign in with your Google account.
2. Click **New Project**.
3. Name it exactly: **quoterevive**
4. Plan: **Free** (no card needed).
5. Region: pick the one closest to the customers (e.g. US East or EU West —
   either is fine).
6. Set a **database password**: let the password generator make a strong one
   and **save it in your password manager**. You will not need it day-to-day,
   and you must **never send it to anyone in chat** (not even Jarvis).

## Step 2 — Create the tables

1. In the new project, open **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open the file `supabase/schema.sql` from this project (GitHub repo →
   `supabase` folder), copy the **whole file**, and paste it into the editor.
4. Click **Run**. You should see "Success. No rows returned" — that is
   correct. The tables, security rules (each user only ever sees their own
   data) and indexes are now created.

## Step 3 — Copy TWO values and send them to Jarvis

1. Go to **Project Settings → API** (gear icon, then "API").
2. Copy these two values only:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (under "Project API keys" — the long key labelled
     `anon` / `public`)
3. Send both to Jarvis in chat.

**Why these two are safe to share:** the anon key is a *public* key — it is
designed to be inside the website's code. Your data stays protected because
the database security rules (Step 2) check who is logged in on every request.

**Never share these, with anyone, ever:**
- the **service_role** key (also on that API page — it bypasses all security
  rules; Jarvis will never ask for it),
- the **database password** from Step 1.

## Step 4 — Jarvis wires the app (nothing for you to do)

Once Jarvis has the Project URL + anon key, he will:

1. Connect the app to Supabase Auth — real sign-up / log-in accounts.
2. Move quotes, campaigns, touches and replies to the cloud tables.
3. Add the two values as environment variables on Vercel and redeploy.
4. Re-run the full test suite and verify the live site.

---

## What changes for users — and what does not

**Changes:**
- An account works on **any device** — register on a phone, log in later on
  a laptop, data is there.
- Data lives safely in the cloud instead of one browser (clearing browser
  data no longer wipes an account).

**Stays exactly the same:**
- **30 days free** for every new account, with the same countdown.
- After the free month the plan will be **$10/month** (payments come later,
  in a separate phase — nothing is charged by this step).
- The same design, the same 4-touch sequence, the same "sends from your own
  Gmail" idea.
