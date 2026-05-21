-- =====================================================
-- Auto-create profile row when an auth.users row is inserted.
-- The first user gets role='owner'; subsequent users get 'assistant'.
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if (select count(*) from public.profiles) = 0 then
    v_role := 'owner';
  else
    v_role := 'assistant';
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Allow logged-in users to read their own profile (already covered by staff_all_profiles,
-- but make it explicit and tighter)
drop policy if exists "users_read_own_profile" on public.profiles;
create policy "users_read_own_profile"
  on public.profiles for select
  using (auth.uid() = id);
