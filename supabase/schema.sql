-- QuoteRevive — Phase 2 Supabase schema
-- Run this once in the Supabase SQL Editor (see PHASE2-SUPABASE.md).
--
-- Design notes:
-- * Auth is Supabase Auth (auth.users). Each table row belongs to exactly one
--   user, and Row Level Security (RLS) is ENABLED on every table with
--   policies that only ever expose a user's own rows (auth.uid()).
-- * profiles.id IS the auth user id (no separate user_id column there).
-- * The app's local types map 1:1: Quote -> quotes, campaign templates are
--   stored as jsonb on the campaign, Touch -> touches, reply board -> replies.

-- ---------------------------------------------------------------------------
-- profiles — one row per signed-up user, created at sign-up
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  business_name text not null default '',
  owner_name    text not null default '',
  trade         text not null default '',
  reply_to_email text not null default '',
  booking_link  text not null default '',
  trial_start   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"   on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: delete own" on public.profiles
  for delete using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- quotes — the contractor's imported dead quotes
-- status mirrors the app: New | In sequence | Replied | Booked | Dead
-- ---------------------------------------------------------------------------
create table if not exists public.quotes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  customer_name text not null,
  email         text not null,
  phone         text,
  job_type      text not null default '',
  amount        numeric(12, 2) not null default 0,
  quote_date    date,
  status        text not null default 'New',
  created_at    timestamptz not null default now()
);

alter table public.quotes enable row level security;

create policy "quotes: read own"   on public.quotes
  for select using (auth.uid() = user_id);
create policy "quotes: insert own" on public.quotes
  for insert with check (auth.uid() = user_id);
create policy "quotes: update own" on public.quotes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quotes: delete own" on public.quotes
  for delete using (auth.uid() = user_id);

create index if not exists quotes_user_id_idx on public.quotes (user_id);
create index if not exists quotes_user_status_idx on public.quotes (user_id, status);

-- ---------------------------------------------------------------------------
-- campaigns — a launched 4-touch sequence; the 4 email templates live in
-- the templates jsonb column, in the same shape the app uses today:
-- [{ "day": 0, "subject": "...", "body": "..." }, ... day 3, 10, 25]
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null default 'Quote follow-up',
  templates   jsonb not null default '[]'::jsonb,
  launched_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;

create policy "campaigns: read own"   on public.campaigns
  for select using (auth.uid() = user_id);
create policy "campaigns: insert own" on public.campaigns
  for insert with check (auth.uid() = user_id);
create policy "campaigns: update own" on public.campaigns
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "campaigns: delete own" on public.campaigns
  for delete using (auth.uid() = user_id);

create index if not exists campaigns_user_id_idx on public.campaigns (user_id);

-- ---------------------------------------------------------------------------
-- touches — one scheduled/sent follow-up email: campaign × quote × touch #
-- status mirrors the app: pending | sent | cancelled (stop-on-reply)
-- ---------------------------------------------------------------------------
create table if not exists public.touches (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  quote_id    uuid not null references public.quotes (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  touch_index int not null check (touch_index between 0 and 3),
  due_date    date not null,
  status      text not null default 'pending',
  sent_at     timestamptz
);

alter table public.touches enable row level security;

create policy "touches: read own"   on public.touches
  for select using (auth.uid() = user_id);
create policy "touches: insert own" on public.touches
  for insert with check (auth.uid() = user_id);
create policy "touches: update own" on public.touches
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "touches: delete own" on public.touches
  for delete using (auth.uid() = user_id);

create index if not exists touches_user_id_idx on public.touches (user_id);
create index if not exists touches_campaign_id_idx on public.touches (campaign_id);
create index if not exists touches_quote_id_idx on public.touches (quote_id);
create index if not exists touches_user_due_idx on public.touches (user_id, due_date) where status = 'pending';

-- ---------------------------------------------------------------------------
-- replies — reply-board state per quote
-- status mirrors the app: New | Interested | Not now | Booked
-- ---------------------------------------------------------------------------
create table if not exists public.replies (
  id         uuid primary key default gen_random_uuid(),
  quote_id   uuid not null references public.quotes (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  status     text not null default 'New',
  note       text,
  updated_at timestamptz not null default now(),
  unique (quote_id)
);

alter table public.replies enable row level security;

create policy "replies: read own"   on public.replies
  for select using (auth.uid() = user_id);
create policy "replies: insert own" on public.replies
  for insert with check (auth.uid() = user_id);
create policy "replies: update own" on public.replies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "replies: delete own" on public.replies
  for delete using (auth.uid() = user_id);

create index if not exists replies_user_id_idx on public.replies (user_id);
create index if not exists replies_quote_id_idx on public.replies (quote_id);
