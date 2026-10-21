-- Aquar.io: cloud copy of Habits (ADR-004). Same rules as the To Do tables:
-- one owner per row (RLS), last write wins (sync_guard), soft deletes, ISO-8601 text timestamps.
-- Requires 20261020000000_todo_sync.sql (it defines public.sync_guard).

create table public.habits (
  id                 uuid primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name               text not null,
  creature           text not null,
  days               integer not null,
  sort_order         double precision not null,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

-- A check-in's id is "<habit id>:<day>": the same day checked on two devices is one row.
create table public.habit_checks (
  id                 text primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id           uuid not null,
  date               text not null,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

create index habits_sync_idx on public.habits (user_id, server_updated_at);
create index habit_checks_sync_idx on public.habit_checks (user_id, server_updated_at);

create trigger habits_sync_guard before insert or update on public.habits
  for each row execute function public.sync_guard();
create trigger habit_checks_sync_guard before insert or update on public.habit_checks
  for each row execute function public.sync_guard();

alter table public.habits enable row level security;
alter table public.habit_checks enable row level security;

create policy "own habits: read" on public.habits for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own habits: add" on public.habits for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own habits: change" on public.habits for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own checks: read" on public.habit_checks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own checks: add" on public.habit_checks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own checks: change" on public.habit_checks for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.habits, public.habit_checks from anon;
grant select, insert, update on public.habits, public.habit_checks to authenticated;
