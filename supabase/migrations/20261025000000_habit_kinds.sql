-- Aquar.io: habit kinds (First Dive, Hábitos 2.0). Habits gain a kind and a goal, and a
-- day's partial progress (copos, minutos, passos) syncs in habit_progress.
-- Same rules as habit_checks: one owner per row (RLS), last write wins (sync_guard).
-- Requires 20261021000000_habits_sync.sql.

alter table public.habits add column kind text not null default 'check';
alter table public.habits add column target integer not null default 1;
alter table public.habits add column unit text;
alter table public.habits add column steps text;

-- A day's progress id is "<habit id>:<day>", like a check-in.
create table public.habit_progress (
  id                 text primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id           uuid not null,
  date               text not null,
  amount             integer not null default 0,
  steps_done         text,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

create index habit_progress_sync_idx on public.habit_progress (user_id, server_updated_at);

create trigger habit_progress_sync_guard before insert or update on public.habit_progress
  for each row execute function public.sync_guard();

alter table public.habit_progress enable row level security;

create policy "own progress: read" on public.habit_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own progress: add" on public.habit_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own progress: change" on public.habit_progress for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.habit_progress from anon;
grant select, insert, update on public.habit_progress to authenticated;
