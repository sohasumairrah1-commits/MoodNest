-- MoodNest PostgreSQL schema
-- Run in Supabase Dashboard > SQL Editor.
-- Supabase Auth is the source of truth for identities; profiles is an optional public profile table.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  mood text not null check (mood in ('Happy','Calm','Neutral','Anxious','Sad','Stressed')),
  mood_intensity integer not null check (mood_intensity between 1 and 5),
  sleep_minutes integer not null check (sleep_minutes between 0 and 1440),
  sleep_quality text not null check (sleep_quality in ('Poor','Fair','Good','Excellent')),
  notes text not null default '' check (char_length(notes) <= 5000),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_one_per_user_per_date unique (user_id, entry_date),
  constraint entries_tags_allowed check (tags <@ array['Exercise','Study','Family','Work','Rest','Social']::text[])
);

create index if not exists entries_user_date_idx on public.entries (user_id, entry_date desc);

alter table public.profiles enable row level security;
alter table public.entries enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Users can read own entries" on public.entries;
create policy "Users can read own entries" on public.entries for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create own entries" on public.entries;
create policy "Users can create own entries" on public.entries for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own entries" on public.entries;
create policy "Users can update own entries" on public.entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own entries" on public.entries;
create policy "Users can delete own entries" on public.entries for delete to authenticated using ((select auth.uid()) = user_id);

-- Optional profile creation trigger. It copies only the display name from Auth metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists entries_updated_at on public.entries;
create trigger entries_updated_at before update on public.entries
for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

-- No service-role key is needed by this app. The backend forwards each user's access token,
-- so requests are evaluated under that user's identity and protected by RLS.