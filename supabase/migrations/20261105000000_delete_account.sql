-- Aquar.io: "Apagar minha conta" (Ajustes → Conta e dados).
-- Deleting the auth user removes every row of theirs: each table's user_id references
-- auth.users on delete cascade. Only the signed-in person can delete themselves.
-- Safe to run more than once.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
