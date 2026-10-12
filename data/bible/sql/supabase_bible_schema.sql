-- OmideNo7 Bible App Core Tables
create table if not exists bible_books (
  id text primary key,
  book_order int not null,
  testament text not null,
  names jsonb not null,
  chapters int not null
);

create table if not exists bible_verses (
  id text primary key,
  book_id text references bible_books(id),
  chapter int not null,
  verse int not null,
  text jsonb not null,
  search_text jsonb,
  keywords text[] default '{}',
  strongs jsonb default '[]',
  cross_references text[] default '{}'
);

create index if not exists idx_bible_verses_book_chapter on bible_verses(book_id, chapter, verse);
create index if not exists idx_bible_verses_keywords on bible_verses using gin(keywords);

create table if not exists user_bible_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  verse_id text references bible_verses(id),
  activity_type text not null check (activity_type in ('highlight','note','bookmark','bold','share','search')),
  payload jsonb default '{}',
  points int default 0,
  created_at timestamptz default now()
);

create table if not exists reading_plans (
  id text primary key,
  duration_days int not null,
  title jsonb not null,
  days jsonb not null
);

create table if not exists user_reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id text references reading_plans(id),
  current_day int default 1,
  completed_days jsonb default '[]',
  streak int default 0,
  total_points int default 0,
  badges text[] default '{}',
  updated_at timestamptz default now(),
  unique(user_id, plan_id)
);

create table if not exists user_points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source text not null,
  source_id text,
  points int not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);