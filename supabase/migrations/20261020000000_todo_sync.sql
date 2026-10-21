-- Aquar.io: cloud copy of the To Do data (ADR-004).
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
-- Rules:
-- - Every row belongs to one user; Row Level Security lets each person reach only their rows.
-- - Last write wins: an upload older than what the server has is ignored.
-- - server_updated_at marks when the server accepted a row; devices download by it.
-- - Nothing is ever hard-deleted: deleted_at marks deletions, like on the device.
-- - Timestamps written by devices stay as ISO-8601 text, exactly as SQLite stores them.

create table public.task_lists (
  id                 uuid primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name               text not null,
  emoji              text,
  color              text,
  sort_order         double precision not null,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

create table public.tasks (
  id                 uuid primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  list_id            uuid not null,
  parent_task_id     uuid,
  title              text not null,
  notes              text,
  priority           integer not null default 0,
  due_date           text,
  completed_at       text,
  sort_order         double precision not null,
  source_type        text,
  source_id          text,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

create index task_lists_sync_idx on public.task_lists (user_id, server_updated_at);
create index tasks_sync_idx on public.tasks (user_id, server_updated_at);

-- Last write wins, and the server owns user_id and server_updated_at.
create function public.sync_guard() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.updated_at collate "C" < old.updated_at collate "C" then
      return null; -- older than what we have: keep the current row
    end if;
    new.user_id := old.user_id;
  end if;
  new.server_updated_at := date_trunc('milliseconds', clock_timestamp());
  return new;
end;
$$;

create trigger task_lists_sync_guard before insert or update on public.task_lists
  for each row execute function public.sync_guard();
create trigger tasks_sync_guard before insert or update on public.tasks
  for each row execute function public.sync_guard();

-- Each person reaches only their own rows. No delete policy: deletions are soft.
alter table public.task_lists enable row level security;
alter table public.tasks enable row level security;

create policy "own lists: read" on public.task_lists for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own lists: add" on public.task_lists for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own lists: change" on public.task_lists for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own tasks: read" on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own tasks: add" on public.tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own tasks: change" on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.task_lists, public.tasks from anon;
grant select, insert, update on public.task_lists, public.tasks to authenticated;
