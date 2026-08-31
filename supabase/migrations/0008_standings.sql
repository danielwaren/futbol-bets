-- Tablas de posiciones. Mismo patrón que matches_cache: una edge function con
-- cron llena la caché compartida y el cliente solo lee.

create table if not exists public.standings_cache (
  league text not null,
  season int not null,
  position int not null,
  team text not null,
  played int not null default 0,
  won int not null default 0,
  drawn int not null default 0,
  lost int not null default 0,
  goals_for int not null default 0,
  goals_against int not null default 0,
  goal_diff int not null default 0,
  points int not null default 0,
  /** 'W','D','L' de los últimos partidos, más reciente al final */
  form text,
  -- Forma parte de la PK, así que Postgres lo hace NOT NULL: necesita default
  -- para las ligas sin grupos.
  group_label text not null default '',
  /** 'ucl' | 'uel' | 'relegation' | null — para pintar la zona */
  zone text,
  updated_at timestamptz not null default now(),
  primary key (league, season, group_label, team)
);

create index if not exists standings_cache_league_idx
  on public.standings_cache (league, season, position);

alter table public.standings_cache enable row level security;

-- Igual que matches_cache: lectura para cualquier usuario autenticado; solo el
-- service role escribe.
drop policy if exists standings_cache_read on public.standings_cache;
create policy standings_cache_read on public.standings_cache
  for select to authenticated using (true);

-- Bitácora de refrescos, para vigilar el consumo del plan gratuito.
create table if not exists public.standings_refresh_log (
  id bigint generated always as identity primary key,
  league text,
  ran_at timestamptz not null default now(),
  rows int,
  error text
);
alter table public.standings_refresh_log enable row level security;
-- sin políticas: solo service role
