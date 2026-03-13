-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- SECURITY NOTE: Enable pgcrypto for PIN hashing in production:
--   create extension if not exists pgcrypto;
-- Then change the pin column to store hashed values:
--   alter table students alter column pin type text using crypt(pin, gen_salt('bf'));
-- And use crypt(input_pin, pin) = pin for verification.
-- The current schema stores PINs as plaintext for development simplicity.
-- The app verifies PINs server-side via /api/verify-pin to avoid sending
-- PIN values to the client.

-- Students (children under a parent)
create table students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar_emoji text not null default '🦊',
  pin text not null default '0000',
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'expert')),
  voice_character_id text not null default 'frax',
  created_at timestamptz not null default now()
);

-- Progress (mirrors PlayerProgress from lib/progress.ts)
create table student_progress (
  student_id uuid primary key references students(id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 0,
  mastery_level integer not null default 0,
  unlocked_modes text[] not null default '{compare}',
  daily_xp integer not null default 0,
  daily_goal integer not null default 20,
  last_session_date date not null default current_date,
  consecutive_days integer not null default 1,
  lifetime_matches integer not null default 0,
  lifetime_smashes integer not null default 0,
  lifetime_merges integer not null default 0,
  discovered_equivalences text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Badges
create table student_badges (
  student_id uuid references students(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (student_id, badge_id)
);

-- Session logs (for parent dashboard)
create table session_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  xp_earned integer not null default 0,
  challenges_completed integer not null default 0
);

-- Row Level Security
alter table students enable row level security;
alter table student_progress enable row level security;
alter table student_badges enable row level security;
alter table session_logs enable row level security;

-- Parents see only their own students
create policy "parents_own_students" on students
  for all using (parent_id = auth.uid());

create policy "parents_own_progress" on student_progress
  for all using (student_id in (select id from students where parent_id = auth.uid()));

create policy "parents_own_badges" on student_badges
  for all using (student_id in (select id from students where parent_id = auth.uid()));

create policy "parents_own_logs" on session_logs
  for all using (student_id in (select id from students where parent_id = auth.uid()));

-- Auto-create progress row when a student is inserted
create or replace function create_student_progress()
returns trigger as $$
begin
  insert into student_progress (student_id) values (new.id);
  return new;
end;
$$ language plpgsql;

create trigger on_student_created
  after insert on students
  for each row execute function create_student_progress();
