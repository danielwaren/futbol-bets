-- Mercados nuevos (tarjetas, tiros, tiros a puerta) + apuestas combinadas.
--
-- Modelo de la combinada: la fila de `bets` es la madre (guarda el stake y la
-- cuota efectiva, y sigue siendo lo unico que mueve la banca via `bets_recalc`)
-- y cada seleccion vive en `bet_legs`. Cuando una pata se resuelve,
-- `recalc_parlay` recalcula la madre y el trigger de banca se dispara solo.

-- ============ Mercados nuevos ============

alter table public.bets drop constraint if exists bets_market_check;
alter table public.bets add constraint bets_market_check check (
  market in ('1x2','goals','btts','corners','cards','shots','shots_on_target','parlay')
);

-- Una combinada de 12 patas a cuota 3 se sale de numeric(8,3).
alter table public.bets alter column odds type numeric(12,3);

-- Si se anulan todas las patas la cuota efectiva es 1, asi que `odds > 1`
-- ya no vale para la fila madre.
alter table public.bets drop constraint if exists bets_odds_check;
alter table public.bets add constraint bets_odds_check check (odds >= 1);

alter table public.bets
  add column if not exists kind text not null default 'single'
    check (kind in ('single','parlay'));

-- ============ Patas de la combinada ============

create table if not exists public.bet_legs (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references public.bets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  league text not null,
  match_id text,
  home_team text not null,
  away_team text not null,
  match_date timestamptz not null,
  market text not null check (
    market in ('1x2','goals','btts','corners','cards','shots','shots_on_target')
  ),
  selection text not null,
  selection_label text not null,
  line numeric(6,2),
  odds numeric(8,3) not null check (odds > 1),
  status text not null default 'pending' check (status in ('pending','won','lost','void')),
  settled_at timestamptz,
  settled_by text check (settled_by in ('auto','manual')),
  result_detail text,
  created_at timestamptz not null default now()
);

create index if not exists bet_legs_bet_idx on public.bet_legs (bet_id);
create index if not exists bet_legs_pending_idx
  on public.bet_legs (status, match_date) where status = 'pending';

alter table public.bet_legs enable row level security;

drop policy if exists bet_legs_all_own on public.bet_legs;
create policy bet_legs_all_own on public.bet_legs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ Limites de plan en cada pata ============
-- SECURITY DEFINER obligatorio: el trigger corre como `authenticated`, que no
-- tiene EXECUTE sobre all_leagues()/free_leagues() (revocados en 0003).

create or replace function public.enforce_leg_plan()
returns trigger language plpgsql security definer set search_path = '' as $fn$
declare
  p text := public.current_plan(new.user_id);
begin
  if not (new.league = any(public.all_leagues())) then
    raise exception 'Liga no soportada: %', new.league;
  end if;
  if p = 'free' and not (new.league = any(public.free_leagues(new.user_id))) then
    raise exception
      'La liga % no esta en tu seleccion free. Cambiala en Cuenta o pasate a premium.',
      new.league;
  end if;
  return new;
end;
$fn$;

drop trigger if exists bet_legs_enforce_plan on public.bet_legs;
create trigger bet_legs_enforce_plan
  before insert on public.bet_legs
  for each row execute function public.enforce_leg_plan();

-- ============ Recalculo de la combinada ============

create or replace function public.recalc_parlay(p_bet_id uuid)
returns void language plpgsql security definer set search_path = '' as $fn$
declare
  b          record;
  r          record;
  n_total    int := 0;
  n_void     int := 0;
  n_lost     int := 0;
  n_won      int := 0;
  n_live     int := 0;
  eff        numeric := 1;
  new_status text;
  by_whom    text;
  detail     text;
begin
  select * into b from public.bets where id = p_bet_id;
  if not found or b.kind <> 'parlay' then
    return;
  end if;

  select count(*),
         count(*) filter (where status = 'void'),
         count(*) filter (where status = 'lost'),
         count(*) filter (where status = 'won')
    into n_total, n_void, n_lost, n_won
    from public.bet_legs where bet_id = p_bet_id;

  n_live := n_total - n_void;

  -- Producto exacto en numeric (nada de exp(sum(ln))): las cuotas son dinero.
  for r in
    select odds from public.bet_legs
    where bet_id = p_bet_id and status <> 'void'
  loop
    eff := eff * r.odds;
  end loop;
  eff := round(eff, 3);

  if n_total = 0 then
    new_status := 'pending';
  elsif n_lost > 0 then
    -- Una pata perdida tumba la combinada aunque queden partidos por jugar.
    new_status := 'lost';
  elsif n_live = 0 then
    new_status := 'void';
    eff := 1;
  elsif n_won = n_live then
    new_status := 'won';
  else
    new_status := 'pending';
  end if;

  if new_status = 'pending' then
    by_whom := null;
    detail  := null;
  else
    select case when bool_or(settled_by = 'manual') then 'manual' else 'auto' end
      into by_whom
      from public.bet_legs where bet_id = p_bet_id and status <> 'pending';
    by_whom := coalesce(by_whom, 'auto');
    detail := n_won || '/' || greatest(n_live, 0) || ' patas'
      || case when n_void > 0 then ' - ' || n_void || ' anulada(s)' else '' end;
  end if;

  update public.bets set
    odds             = greatest(eff, 1),
    potential_return = round(stake * greatest(eff, 1)),
    status           = new_status,
    settled_at       = case when new_status = 'pending' then null
                            else coalesce(settled_at, now()) end,
    settled_by       = case when new_status = 'pending' then null else by_whom end,
    result_detail    = detail
  where id = p_bet_id;
end;
$fn$;

create or replace function public.bet_legs_recalc_trigger()
returns trigger language plpgsql security definer set search_path = '' as $fn$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_parlay(old.bet_id);
    return old;
  end if;
  perform public.recalc_parlay(new.bet_id);
  return new;
end;
$fn$;

drop trigger if exists bet_legs_recalc on public.bet_legs;
create trigger bet_legs_recalc
  after insert or update or delete on public.bet_legs
  for each row execute function public.bet_legs_recalc_trigger();

-- ============ Crear una combinada (atomico) ============
-- SECURITY INVOKER: la RLS de `bets`/`bet_legs` sigue aplicando. Es un RPC para
-- que la madre y sus patas entren en la misma transaccion: si una liga esta
-- bloqueada por el plan, no queda una combinada huerfana a medio crear.

create or replace function public.create_parlay(
  p_bankroll_id uuid,
  p_stake       numeric,
  p_notes       text,
  p_legs        jsonb
) returns uuid
language plpgsql security invoker set search_path = '' as $fn$
declare
  uid       uuid := auth.uid();
  n         int  := jsonb_array_length(p_legs);
  leg       jsonb;
  eff       numeric := 1;
  last_date timestamptz;
  first_lg  text;
  n_ids     int;
  n_uniq    int;
  new_id    uuid;
begin
  if uid is null then
    raise exception 'Necesitas iniciar sesion.';
  end if;
  if n is null or n < 2 then
    raise exception 'Una combinada necesita al menos 2 selecciones.';
  end if;
  if n > 12 then
    raise exception 'Maximo 12 selecciones por combinada.';
  end if;
  if p_stake is null or p_stake <= 0 then
    raise exception 'El monto debe ser mayor que 0.';
  end if;

  -- Un mismo partido no puede aparecer dos veces: los resultados se
  -- correlacionan y ninguna casa lo permite.
  select count(*), count(distinct value ->> 'match_id')
    into n_ids, n_uniq
    from jsonb_array_elements(p_legs)
    where value ->> 'match_id' is not null;
  if n_ids <> n_uniq then
    raise exception 'No puedes combinar dos selecciones del mismo partido.';
  end if;

  for leg in select value from jsonb_array_elements(p_legs) loop
    eff := eff * (leg ->> 'odds')::numeric;
    last_date := greatest(last_date, (leg ->> 'match_date')::timestamptz);
    first_lg := coalesce(first_lg, leg ->> 'league');
  end loop;
  eff := round(eff, 3);

  insert into public.bets (
    user_id, bankroll_id, kind, league, match_id,
    home_team, away_team, match_date,
    market, selection, selection_label, line,
    odds, stake, potential_return, status, notes
  ) values (
    uid, p_bankroll_id, 'parlay', first_lg, null,
    'Combinada', n || ' selecciones', last_date,
    'parlay', 'parlay', n || ' selecciones', null,
    eff, p_stake, round(p_stake * eff), 'pending', p_notes
  ) returning id into new_id;

  insert into public.bet_legs (
    bet_id, user_id, league, match_id, home_team, away_team,
    match_date, market, selection, selection_label, line, odds
  )
  select
    new_id, uid, value ->> 'league', value ->> 'match_id',
    value ->> 'home_team', value ->> 'away_team',
    (value ->> 'match_date')::timestamptz,
    value ->> 'market', value ->> 'selection', value ->> 'selection_label',
    nullif(value ->> 'line', '')::numeric,
    (value ->> 'odds')::numeric
  from jsonb_array_elements(p_legs);

  return new_id;
end;
$fn$;

revoke execute on function public.recalc_parlay(uuid) from public, anon, authenticated;
revoke execute on function public.bet_legs_recalc_trigger() from public, anon, authenticated;
revoke execute on function public.enforce_leg_plan() from public, anon, authenticated;
grant execute on function public.create_parlay(uuid, numeric, text, jsonb) to authenticated;
