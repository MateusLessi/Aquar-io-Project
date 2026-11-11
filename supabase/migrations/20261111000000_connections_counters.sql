-- Aquar.io: Lapidação, Fase 1a. Items with their own counter or timer, lists that start over
-- every day (their items are marked per day in task_checks), and a rule on a link (how a habit
-- is done from a list, folder or routine). Only adds: safe to run more than once.

alter table public.tasks add column if not exists kind text not null default 'check';
alter table public.tasks add column if not exists target integer;
alter table public.tasks add column if not exists unit text;
alter table public.tasks add column if not exists amount integer not null default 0;
alter table public.task_lists add column if not exists resets integer not null default 0;
alter table public.links add column if not exists rule text;

create table if not exists public.task_checks (
  id                 text primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_id            uuid not null,
  list_id            uuid not null,
  date               text not null,
  amount             integer not null default 0,
  done               integer not null default 0,
  created_at         text not null,
  updated_at         text not null,
  deleted_at         text,
  server_updated_at  timestamptz not null default now()
);

create index if not exists task_checks_sync_idx on public.task_checks (user_id, server_updated_at);

drop trigger if exists task_checks_sync_guard on public.task_checks;
create trigger task_checks_sync_guard before insert or update on public.task_checks
  for each row execute function public.sync_guard();

alter table public.task_checks enable row level security;

drop policy if exists "own task checks: read" on public.task_checks;
create policy "own task checks: read" on public.task_checks for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "own task checks: add" on public.task_checks;
create policy "own task checks: add" on public.task_checks for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "own task checks: change" on public.task_checks;
create policy "own task checks: change" on public.task_checks for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.task_checks from anon;
grant select, insert, update on public.task_checks to authenticated;
