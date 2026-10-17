create table if not exists public.saved_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  domain text not null check (domain in ('sports', 'markets', 'crypto', 'forex')),
  subject text not null check (char_length(subject) between 1 and 160),
  title text not null check (char_length(title) between 1 and 200),
  summary text not null default '' check (char_length(summary) <= 1000),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  analysis jsonb not null default '{}'::jsonb check (jsonb_typeof(analysis) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists saved_analyses_user_created_idx on public.saved_analyses (user_id, created_at desc);
alter table public.saved_analyses enable row level security;
drop policy if exists "Users manage their own saved analyses" on public.saved_analyses;
create policy "Users manage their own saved analyses" on public.saved_analyses
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.saved_analyses to authenticated;

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  domain text not null check (domain in ('sports', 'markets', 'crypto', 'forex')),
  symbol text not null check (char_length(symbol) between 1 and 80),
  label text not null default '' check (char_length(label) <= 160),
  created_at timestamptz not null default now(),
  unique (user_id, domain, symbol)
);

create index if not exists watchlists_user_created_idx on public.watchlists (user_id, created_at desc);
alter table public.watchlists enable row level security;
drop policy if exists "Users manage their own watchlists" on public.watchlists;
create policy "Users manage their own watchlists" on public.watchlists
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.watchlists to authenticated;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  domain text not null check (domain in ('sports', 'markets', 'crypto', 'forex')),
  subject text not null check (char_length(subject) between 1 and 160),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);
alter table public.notes enable row level security;
drop policy if exists "Users manage their own notes" on public.notes;
create policy "Users manage their own notes" on public.notes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.notes to authenticated;

create table if not exists public.activity_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  domain text not null check (domain in ('overview', 'sports', 'markets', 'crypto', 'forex', 'saved')),
  route text not null check (char_length(route) between 1 and 300),
  viewed_at timestamptz not null default now()
);

create index if not exists activity_history_user_viewed_idx on public.activity_history (user_id, viewed_at desc);
alter table public.activity_history enable row level security;
drop policy if exists "Users manage their own activity history" on public.activity_history;
create policy "Users manage their own activity history" on public.activity_history
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.activity_history to authenticated;
