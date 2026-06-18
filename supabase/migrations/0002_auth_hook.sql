-- =========================================================================
-- Radar I+D / I+D Hub — Auth hook
-- Auto-provisions a `profiles` row when a new auth user is created.
-- Separated from 0001 because it attaches a trigger to the `auth.users` table.
-- Reads `nombre` from user_metadata (set during sign-up) to fill the profile.
-- =========================================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nombre, email)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
