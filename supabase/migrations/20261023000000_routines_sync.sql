-- Aquar.io: cloud copy of Routines (ADR-004). Same rules as the other tables:
-- one owner per row (RLS), last write wins (sync_guard), soft deletes, ISO-8601 text timestamps.
-- Requires 20261020000000_todo_sync.sql (it defines public.sync_guard).

create table public.routines (
  id                 uuid primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name               text not null,
  emoji              text,
  color              text not null,
  start_time         text not null,
  end_time           text not null,
  days               integer not null,
  remind             integer not null default 0,
  sort_order         double precision not null,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

create table public.routine_items (
  id                 uuid primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_id         uuid not null,
  title              text not null,
  sort_order         double precision not null,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

-- A check's id is "<item id>:<day>": the same item checked on two devices is one row.
create table public.routine_checks (
  id                 text primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id            uuid not null,
  routine_id         uuid not null,
  date               text not null,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

create index routines_sync_idx on public.routines (user_id, server_updated_at);
create index routine_items_sync_idx on public.routine_items (user_id, server_updated_at);
create index routine_checks_sync_idx on public.routine_checks (user_id, server_updated_at);

create trigger routines_sync_guard before insert or update on public.routines
  for each row execute function public.sync_guard();
create trigger routine_items_sync_guard before insert or update on public.routine_items
  for each row execute function public.sync_guard();
create trigger routine_checks_sync_guard before insert or update on public.routine_checks
  for each row execute function public.sync_guard();

alter table public.routines enable row level security;
alter table public.routine_items enable row level security;
alter table public.routine_checks enable row level security;

create policy "own routines: read" on public.routines for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own routines: add" on public.routines for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own routines: change" on public.routines for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own routine items: read" on public.routine_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own routine items: add" on public.routine_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own routine items: change" on public.routine_items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own routine checks: read" on public.routine_checks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own routine checks: add" on public.routine_checks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own routine checks: change" on public.routine_checks for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.routines, public.routine_items, public.routine_checks from anon;
grant select, insert, update on public.routines, public.routine_items, public.routine_checks
  to authenticated;
