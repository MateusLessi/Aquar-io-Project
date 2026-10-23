-- Aquar.io: the person's profile (name and creature avatar), synced across devices.
-- Every device uses the fixed id 'me', so a row is identified by (user_id, id).
-- Requires 20261020000000_todo_sync.sql (it defines public.sync_guard).

create table public.profile (
  id                 text not null,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name               text,
  creature           text,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index profile_sync_idx on public.profile (user_id, server_updated_at);

create trigger profile_sync_guard before insert or update on public.profile
  for each row execute function public.sync_guard();

alter table public.profile enable row level security;

create policy "own profile: read" on public.profile for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own profile: add" on public.profile for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own profile: change" on public.profile for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.profile from anon;
grant select, insert, update on public.profile to authenticated;
