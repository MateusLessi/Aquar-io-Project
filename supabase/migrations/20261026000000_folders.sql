-- Aquar.io: folders for lists (First Dive, etapa 2). A folder holds lists and other folders,
-- up to 4 levels; each list remembers its folder. Same rules as task_lists: one owner per row
-- (RLS), last write wins (sync_guard), soft deletes.
-- Requires 20261020000000_todo_sync.sql.

create table public.task_folders (
  id                 uuid primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  parent_id          uuid,
  name               text not null,
  emoji              text,
  color              text,
  pinned             integer not null default 0,
  sort_order         double precision not null,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

alter table public.task_lists add column folder_id uuid;

create index task_folders_sync_idx on public.task_folders (user_id, server_updated_at);

create trigger task_folders_sync_guard before insert or update on public.task_folders
  for each row execute function public.sync_guard();

alter table public.task_folders enable row level security;

create policy "own folders: read" on public.task_folders for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own folders: add" on public.task_folders for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own folders: change" on public.task_folders for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.task_folders from anon;
grant select, insert, update on public.task_folders to authenticated;
