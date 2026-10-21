-- Aquar.io: repeating tasks and reminders (ADR-004 tables gain three columns).
-- Run after the earlier migrations. Reminders are scheduled on each device; the cloud only
-- keeps the settings so every device knows them.

alter table public.tasks add column repeat text;
alter table public.tasks add column remind_at text;
alter table public.habits add column reminder_times text;
