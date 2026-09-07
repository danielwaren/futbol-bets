-- Caché de estadísticas de partido (API-Football) + cron dentro de presupuesto.
--
-- Contexto: el 2026-09-03 se agotaron los 500 creditos/mes de The Odds API en
-- tres dias. La causa era `deep = Boolean(body.deep) || isCron` en refresh-odds:
-- el cron "light" de cada 3 horas tambien hacia la pasada profunda sobre las 10
-- ligas. Aqui se reprograma a un ritmo que cabe en el plan gratis; la funcion
-- ademas solo refresca las ligas que algun usuario tiene elegidas.

-- ============ Estadisticas del partido ============
-- Corners, tarjetas y tiros no vienen en /scores de The Odds API. Salen de
-- API-Football (/fixtures/statistics) y se cachean por partido: una vez que el
-- partido termino los numeros ya no cambian, asi que se piden una sola vez.

create table if not exists public.match_stats_cache (
  match_id        text primary key,
  league          text not null,
  fixture_id      bigint,
  home_team       text,
  away_team       text,
  home_score      int,
  away_score      int,
  corners         int,
  cards           int,
  shots           int,
  shots_on_target int,
  fetched_at      timestamptz not null default now()
);

alter table public.match_stats_cache enable row level security;

-- Los mismos permisos que matches_cache: lectura para usuarios autenticados
-- (la app muestra "11 corners" junto a la apuesta resuelta), escritura solo
-- desde las edge functions con el service role.
drop policy if exists match_stats_cache_read on public.match_stats_cache;
create policy match_stats_cache_read on public.match_stats_cache
  for select to authenticated using (true);

create index if not exists match_stats_cache_league_idx
  on public.match_stats_cache (league, fetched_at);

-- ============ Cron dentro del presupuesto ============
-- Plan gratis de The Odds API: 500 creditos/mes (~16/dia). Cada llamada cuesta
-- mercados x regiones. Con 3 ligas activas:
--   light  = 3 ligas x 2 creditos           =  6 por corrida
--   deep   = 3 x (2 + 3 partidos x 3)       = 33 por corrida
-- Light a diario (180/mes) + deep dia por medio (~495/mes) cabe justo. Si el
-- usuario pasa a un plan de pago, subir la frecuencia aqui es todo lo que hace
-- falta: la funcion ya se autolimita cuando quedan pocos creditos.

select cron.unschedule('refresh-odds-light')
  where exists (select 1 from cron.job where jobname = 'refresh-odds-light');
select cron.unschedule('refresh-odds-deep')
  where exists (select 1 from cron.job where jobname = 'refresh-odds-deep');

select cron.schedule(
  'refresh-odds-light', '0 11 * * *',
  $$select public.cron_invoke('refresh-odds', '{"deep": false}'::jsonb)$$
);

select cron.schedule(
  'refresh-odds-deep', '30 11 */2 * *',
  $$select public.cron_invoke('refresh-odds', '{"deep": true}'::jsonb)$$
);

-- settle-bets pasa de cada hora a cada 2 horas: consume creditos de The Odds
-- API por cada liga con apuestas pendientes, y los partidos no terminan tan
-- seguido como para justificar 24 corridas al dia.
select cron.unschedule('settle-bets')
  where exists (select 1 from cron.job where jobname = 'settle-bets');

select cron.schedule(
  'settle-bets', '15 */2 * * *',
  $$select public.cron_invoke('settle-bets')$$
);
