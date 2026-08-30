-- Fantasy Bets — esquema multiusuario (Hito 1)
-- Aplicado al proyecto Supabase dedicado `fantasy-bets` (ref dngolugwcemkexbeagzu).

-- ============ Tablas ============

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free','premium')),
  plan_source text,
  plan_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.bankrolls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Mi banca',
  league text,
  initial_amount numeric(14,2) not null check (initial_amount >= 0),
  current_amount numeric(14,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);
create index bankrolls_user_idx on public.bankrolls (user_id);
create unique index bankrolls_one_active_per_league
  on public.bankrolls (user_id, coalesce(league, ''))
  where is_active;

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bankroll_id uuid not null references public.bankrolls(id) on delete cascade,
  league text not null,
  match_id text,
  home_team text not null,
  away_team text not null,
  match_date timestamptz not null,
  market text not null check (market in ('1x2','corners','btts','goals')),
  selection text not null,
  selection_label text not null,
  line numeric(6,2),
  odds numeric(8,3) not null check (odds > 1),
  stake numeric(14,2) not null check (stake > 0),
  potential_return numeric(14,2) not null,
  status text not null default 'pending' check (status in ('pending','won','lost','void')),
  notes text,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create index bets_user_bankroll_idx on public.bets (user_id, bankroll_id, status);
create index bets_match_date_idx on public.bets (match_date);

create table public.matches_cache (
  id text primary key,
  league text not null,
  sport_key text not null,
  home_team text not null,
  away_team text not null,
  commence_time timestamptz not null,
  odds jsonb not null default '{}'::jsonb,
  bookmaker text,
  fetched_at timestamptz not null default now()
);
create index matches_cache_league_time_idx on public.matches_cache (league, commence_time);

create table public.odds_refresh_log (
  id bigint generated always as identity primary key,
  league text,
  ran_at timestamptz not null default now(),
  events int,
  credits_used int,
  requests_remaining int,
  error text
);

-- ============ Config de planes/ligas (para triggers) ============

create or replace function public.free_leagues()
returns text[] language sql immutable as $$
  select array['chile','laliga','premier']::text[]
$$;

create or replace function public.all_leagues()
returns text[] language sql immutable as $$
  select array['chile','laliga','premier','seriea','bundesliga','ligue1',
               'primeira','eredivisie','brasileirao','argentina']::text[]
$$;

create or replace function public.current_plan(uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case
       when plan = 'premium'
         and (plan_expires_at is null or plan_expires_at > now())
       then 'premium' else 'free' end
     from public.profiles where id = uid),
    'free')
$$;

-- ============ Trigger: crear profile al registrarse ============

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Trigger: límites de banca por plan ============

create or replace function public.enforce_bankroll_plan()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p text := public.current_plan(new.user_id);
  active_count int;
begin
  if tg_op = 'INSERT' and new.is_active then
    select count(*) into active_count
      from public.bankrolls
      where user_id = new.user_id and is_active and id <> new.id;

    if p = 'free' then
      if new.league is not null then
        raise exception 'El plan free solo permite una banca global (sin liga).';
      end if;
      if active_count >= 1 then
        raise exception 'El plan free permite solo 1 banca activa. Actualiza a premium para más.';
      end if;
    else
      if new.league is null or not (new.league = any(public.all_leagues())) then
        raise exception 'Las bancas premium deben asociarse a una liga válida.';
      end if;
      if active_count >= 10 then
        raise exception 'Máximo 10 bancas activas.';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger bankrolls_enforce_plan
  before insert on public.bankrolls
  for each row execute function public.enforce_bankroll_plan();

-- ============ Trigger: ligas permitidas al apostar ============

create or replace function public.enforce_bet_plan()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p text := public.current_plan(new.user_id);
begin
  if not (new.league = any(public.all_leagues())) then
    raise exception 'Liga no soportada: %', new.league;
  end if;
  if p = 'free' and not (new.league = any(public.free_leagues())) then
    raise exception 'La liga % es solo para premium.', new.league;
  end if;
  return new;
end;
$$;

create trigger bets_enforce_plan
  before insert on public.bets
  for each row execute function public.enforce_bet_plan();

-- ============ RLS ============

alter table public.profiles         enable row level security;
alter table public.bankrolls        enable row level security;
alter table public.bets             enable row level security;
alter table public.matches_cache    enable row level security;
alter table public.odds_refresh_log enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete_own on public.profiles
  for delete to authenticated using (auth.uid() = id);

create policy bankrolls_all_own on public.bankrolls
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy bets_all_own on public.bets
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy matches_cache_read on public.matches_cache
  for select to authenticated using (true);

-- odds_refresh_log: sin políticas => solo service role.
