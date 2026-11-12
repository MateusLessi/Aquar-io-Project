-- Aquar.io: Lapidação, Fase 1b. Events on the agenda (an exam, an appointment), which may
-- repeat; and one-day changes to a routine (skipped, or at another time that day only).
-- Requires 20261020000000_todo_sync.sql (public.sync_guard). Only adds: safe to run more than once.

create table if not exists public.events (
  id                 uuid primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title              text not null,
  emoji              text,
  color              text not null,
  date               text not null,
  start_time         text,
  end_time           text,
  repeat             text not null default 'none',
  remind_before      integer,
  notes              text,
  list_id            uuid,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

-- A change's id is "<routine id>:<day>": the same day changed on two devices is one row.
create table if not exists public.routine_overrides (
  id                 text primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_id         uuid not null,
  date               text not null,
  skip               integer not null default 0,
  start_time         text,
  end_time           text,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

create index if not exists events_sync_idx on public.events (user_id, server_updated_at);
create index if not exists routine_overrides_sync_idx
  on public.routine_overrides (user_id, server_updated_at);

drop trigger if exists events_sync_guard on public.events;
create trigger events_sync_guard before insert or update on public.events
  for each row execute function public.sync_guard();
drop trigger if exists routine_overrides_sync_guard on public.routine_overrides;
create trigger routine_overrides_sync_guard before insert or update on public.routine_overrides
  for each row execute function public.sync_guard();

alter table public.events enable row level security;
alter table public.routine_overrides enable row level security;

drop policy if exists "own events: read" on public.events;
create policy "own events: read" on public.events for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "own events: add" on public.events;
create policy "own events: add" on public.events for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "own events: change" on public.events;
create policy "own events: change" on public.events for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own routine overrides: read" on public.routine_overrides;
create policy "own routine overrides: read" on public.routine_overrides for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "own routine overrides: add" on public.routine_overrides;
create policy "own routine overrides: add" on public.routine_overrides for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "own routine overrides: change" on public.routine_overrides;
create policy "own routine overrides: change" on public.routine_overrides for update
  to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.events from anon;
revoke all on public.routine_overrides from anon;
grant select, insert, update on public.events to authenticated;
grant select, insert, update on public.routine_overrides to authenticated;
