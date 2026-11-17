-- Aquar.io: Lapidação, Fase 3. Why a habit matters, in the person's words.
-- Only adds: safe to run more than once.

alter table public.habits add column if not exists description text;
