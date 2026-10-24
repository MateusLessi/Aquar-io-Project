-- Aquar.io: links between lists, folders, habits and routines (First Dive, etapa 3:
-- "Tudo conectado"). A link's id comes from the pair, so the same link made on two devices
-- is one row. Same rules as the other tables: RLS, last write wins, soft deletes.
-- Requires 20261020000000_todo_sync.sql (it defines public.sync_guard).

create table public.links (
  id                 uuid primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_kind          text not null,
  item_id            uuid not null,
  target_kind        text not null,
  target_id          uuid not null,
  at_time            text,
  sort_order         double precision not null,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

create index links_sync_idx on public.links (user_id, server_updated_at);

create trigger links_sync_guard before insert or update on public.links
  for each row execute function public.sync_guard();

alter table public.links enable row level security;

create policy "own links: read" on public.links for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own links: add" on public.links for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own links: change" on public.links for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.links from anon;
grant select, insert, update on public.links to authenticated;
