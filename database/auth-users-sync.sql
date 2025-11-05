-- Sync auth.users -> public.users so every signup/login path creates an app user row
-- Run this in Supabase SQL editor (or your migration runner)

-- 1) Create function: on insert/update in auth.users, upsert into public.users
create or replace function public.sync_auth_user_to_public()
returns trigger as $$
begin
  -- Upsert basic profile fields; prefer new metadata when present
  insert into public.users (id, email, full_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name is not null and excluded.full_name <> '' then excluded.full_name else public.users.full_name end,
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2) Trigger after insert on auth.users
drop trigger if exists on_auth_user_insert_sync on auth.users;
create trigger on_auth_user_insert_sync
  after insert on auth.users
  for each row execute function public.sync_auth_user_to_public();

-- 3) Trigger after update on auth.users (email/metadata changes)
drop trigger if exists on_auth_user_update_sync on auth.users;
create trigger on_auth_user_update_sync
  after update on auth.users
  for each row execute function public.sync_auth_user_to_public();

-- Notes:
-- - Requires table public.users to exist with primary key (id uuid) and columns: email, full_name, avatar_url, created_at, updated_at
-- - RLS on public.users should already allow users to read/update their own rows

-- 4) One-time backfill existing auth.users -> public.users
insert into public.users (id, email, full_name, avatar_url, created_at, updated_at)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  coalesce(u.raw_user_meta_data->>'avatar_url', null),
  now(),
  now()
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  full_name = case when excluded.full_name is not null and excluded.full_name <> '' then excluded.full_name else public.users.full_name end,
  avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
  updated_at = now();

