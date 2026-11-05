-- Aquar.io: the profile card (First Dive, etapa 8). A short line, a color, the three showcase
-- picks and the per-field privacy (JSON text, "me" by default). Safe to run more than once.
alter table public.profile add column if not exists bio text;
alter table public.profile add column if not exists color text;
alter table public.profile add column if not exists showcase text;
alter table public.profile add column if not exists privacy text;
