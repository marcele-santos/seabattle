alter table public.match_sessions
  add column if not exists abandoned_at timestamptz;

create index if not exists match_sessions_active_user_idx
  on public.match_sessions (user_id, expires_at)
  where submitted_at is null and abandoned_at is null;

create or replace function public.create_verified_match_session(
  requested_user_id uuid,
  requested_seed bigint
)
returns table (id uuid, seed bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt()->>'role', '') <> 'service_role' then
    raise exception 'service_role_required';
  end if;
  if requested_user_id is null or requested_seed < 0 or requested_seed > 4294967295 then
    raise exception 'invalid_match_parameters';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(requested_user_id::text, 0)
  );

  update public.match_sessions
  set abandoned_at = now()
  where user_id = requested_user_id
    and submitted_at is null
    and abandoned_at is null
    and expires_at > now();

  return query
  insert into public.match_sessions (user_id, seed)
  values (requested_user_id, requested_seed)
  returning match_sessions.id, match_sessions.seed;
end;
$$;

create or replace function public.finalize_verified_match(
  requested_match_id uuid,
  verified_score integer,
  verified_shots integer,
  verified_hits integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare match_row public.match_sessions%rowtype;
begin
  if coalesce(auth.jwt()->>'role', '') <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  select * into match_row from public.match_sessions
  where id = requested_match_id for update;

  if not found then raise exception 'match_not_found'; end if;
  if match_row.submitted_at is not null then raise exception 'match_already_submitted'; end if;
  if match_row.abandoned_at is not null then raise exception 'match_abandoned'; end if;
  if match_row.expires_at < now() then raise exception 'match_expired'; end if;

  insert into public.match_results (match_id, user_id, score, shots, hits)
  values (match_row.id, match_row.user_id, verified_score, verified_shots, verified_hits);

  update public.match_sessions set submitted_at = now() where id = match_row.id;
end;
$$;

revoke all on function public.create_verified_match_session(uuid, bigint) from public, anon, authenticated;
grant execute on function public.create_verified_match_session(uuid, bigint) to service_role;
revoke all on function public.finalize_verified_match(uuid, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.finalize_verified_match(uuid, integer, integer, integer) to service_role;