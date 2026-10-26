-- Aquar.io: optional label on a routine ("Faculdade", "Saúde"), shown in the week view.
-- Safe to run more than once.
alter table public.routines add column if not exists tag text;
