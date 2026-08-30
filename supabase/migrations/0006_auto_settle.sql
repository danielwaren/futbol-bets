-- Resolución automática de apuestas + recálculo de banca en la BD.

-- Columnas de resolución automática
alter table public.bets
  add column settled_by text check (settled_by in ('auto','manual')),
  add column result_detail text;

-- ============ Recálculo de banca (fuente de verdad única) ============

create or replace function public.bankroll_delta(status text, stake numeric, odds numeric)
returns numeric language sql immutable as $$
  select case status
    when 'won'     then round(stake * (odds - 1))
    when 'lost'    then -stake
    when 'pending' then -stake
    else 0  -- void
  end
$$;

create or replace function public.recalc_bankroll(bid uuid)
returns void language sql security definer set search_path = public as $$
  update public.bankrolls b
  set current_amount = b.initial_amount + coalesce((
    select sum(public.bankroll_delta(x.status, x.stake, x.odds))
    from public.bets x where x.bankroll_id = b.id
  ), 0)
  where b.id = bid;
$$;

create or replace function public.bets_recalc_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalc_bankroll(old.bankroll_id);
    return old;
  end if;
  perform public.recalc_bankroll(new.bankroll_id);
  if tg_op = 'UPDATE' and new.bankroll_id is distinct from old.bankroll_id then
    perform public.recalc_bankroll(old.bankroll_id);
  end if;
  return new;
end;
$$;

create trigger bets_recalc
  after insert or update or delete on public.bets
  for each row execute function public.bets_recalc_trigger();

revoke execute on function public.bankroll_delta(text, numeric, numeric) from public, anon, authenticated;
revoke execute on function public.recalc_bankroll(uuid) from public, anon, authenticated;
revoke execute on function public.bets_recalc_trigger() from public, anon, authenticated;

do $$
declare r record;
begin
  for r in select id from public.bankrolls loop
    perform public.recalc_bankroll(r.id);
  end loop;
end $$;

-- ============ Log de corridas de settle ============

create table public.settle_runs (
  id bigint generated always as identity primary key,
  ran_at timestamptz not null default now(),
  checked int not null default 0,
  settled int not null default 0,
  credits_used int not null default 0,
  requests_remaining int,
  error text
);
alter table public.settle_runs enable row level security;
-- sin políticas: solo service role


-- Endurecimiento (linter)
alter function public.bankroll_delta(text, numeric, numeric) set search_path = '';
