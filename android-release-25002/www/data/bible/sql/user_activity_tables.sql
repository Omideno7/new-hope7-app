-- OmideNo7 Bible Activity / Gamification helper tables
-- Run after authentication is enabled.

create table if not exists bible_user_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action_type text not null,
  target_type text not null,
  target_id text,
  points int default 0,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_bible_user_actions_user_created
on bible_user_actions(user_id, created_at desc);

create table if not exists bible_user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reward_id text not null,
  reward_type text not null check (reward_type in ('badge','level','streak')),
  title jsonb not null,
  awarded_at timestamptz default now(),
  unique(user_id, reward_id)
);

create table if not exists bible_user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  verse_id text not null,
  note text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bible_user_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  verse_id text not null,
  color text default 'yellow',
  selection jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists bible_user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  verse_id text not null,
  folder text default 'default',
  created_at timestamptz default now(),
  unique(user_id, verse_id, folder)
);