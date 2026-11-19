-- Batalha Naval: anonymous identities, server-issued matches and verified leaderboard.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 3 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.match_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  seed bigint not null check (seed between 0 and 4294967295),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  submitted_at timestamptz
);

create table if not exists public.match_results (
  match_id uuid primary key references public.match_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 500 and 10000),
  shots integer not null check (shots between 9 and 64),
  hits integer not null check (hits = 9),
  created_at timestamptz not null default now()
);

create index if not exists match_results_ranking_idx
  on public.match_results (score desc, created_at asc);
create index if not exists match_results_user_idx
  on public.match_results (user_id, score desc);

alter table public.profiles enable row level security;
alter table public.match_sessions enable row level security;
alter table public.match_results enable row level security;

drop policy if exists "profile owner reads own profile" on public.profiles;
create policy "profile owner reads own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profile owner updates own profile" on public.profiles;
create policy "profile owner updates own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

revoke all on public.match_sessions from anon, authenticated;
revoke all on public.match_results from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, 'Comandante-' || upper(substr(replace(new.id::text, '-', ''), 1, 6)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seabattle on auth.users;
create trigger on_auth_user_created_seabattle
  after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.set_display_name(requested_name text)
returns text language plpgsql security definer set search_path = ''
as $$
declare cleaned text := btrim(requested_name);
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if cleaned !~ '^[[:alnum:] _-]{3,20}$' then
    raise exception 'display_name_must_be_3_to_20_safe_characters';
  end if;
  update public.profiles set display_name = cleaned, updated_at = now()
  where id = auth.uid();
  return cleaned;
end;
$$;

create or replace function public.get_leaderboard()
returns table (position bigint, display_name text, score integer, shots integer, hits integer, achieved_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  with best_per_player as (
    select distinct on (r.user_id)
      p.display_name, r.score, r.shots, r.hits, r.created_at
    from public.match_results r
    join public.profiles p on p.id = r.user_id
    order by r.user_id, r.score desc, r.created_at asc
  )
  select row_number() over (order by b.score desc, b.achieved_at asc),
         b.display_name, b.score, b.shots, b.hits, b.created_at
  from best_per_player b
  order by b.score desc, b.achieved_at asc
  limit 50;
$$;

create or replace function public.finalize_verified_match(
  requested_match_id uuid, verified_score integer, verified_shots integer, verified_hits integer
)
returns void language plpgsql security definer set search_path = ''
as $$
declare match_row public.match_sessions%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required'; end if;
  select * into match_row from public.match_sessions
    where id = requested_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if match_row.submitted_at is not null then raise exception 'match_already_submitted'; end if;
  if match_row.expires_at < now() then raise exception 'match_expired'; end if;
  insert into public.match_results (match_id, user_id, score, shots, hits)
    values (match_row.id, match_row.user_id, verified_score, verified_shots, verified_hits);
  update public.match_sessions set submitted_at = now() where id = match_row.id;
end;
$$;

revoke all on function public.finalize_verified_match(uuid, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.finalize_verified_match(uuid, integer, integer, integer) to service_role;
grant execute on function public.get_leaderboard() to anon, authenticated;
grant execute on function public.set_display_name(text) to authenticated;
