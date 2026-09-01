-- Programa el refresco de cuotas y la resolución automática de apuestas.
--
-- La plantilla 0004 exigía pegar a mano la service_role key y un secreto
-- inventado, y por eso nunca se aplicó: el auto-settle jamás corrió. Aquí el
-- secreto se genera solo y vive en la BD (solo lo lee el service role), así que
-- no hay nada que copiar.

create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
-- sin políticas: ni anon ni authenticated pueden leerlo. Solo el service role
-- (las edge functions) y las conexiones directas.

-- Secreto compartido entre el cron y las edge functions. Aleatorio y estable.
insert into public.app_config (key, value)
values ('cron_secret', encode(gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

-- La clave publicable no es un secreto (va dentro de la app), pero el cron la
-- necesita para atravesar el gateway de las edge functions.
insert into public.app_config (key, value)
values ('publishable_key', 'sb_publishable_ofmDuXZoBEWk2QX2gC3OzA_d_n_QGtq')
on conflict (key) do update set value = excluded.value;

-- Helper: cuerpo de la llamada a una edge function con el secreto de cron.
create or replace function public.cron_invoke(fn text, payload jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  pub text;
  sec text;
begin
  select value into pub from public.app_config where key = 'publishable_key';
  select value into sec from public.app_config where key = 'cron_secret';

  perform net.http_post(
    url     := 'https://dngolugwcemkexbeagzu.supabase.co/functions/v1/' || fn,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || pub,
      'apikey', pub
    ),
    body    := payload || jsonb_build_object('cron', true, 'secret', sec)
  );
end;
$$;

revoke execute on function public.cron_invoke(text, jsonb) from public, anon, authenticated;

-- ---------- Programación ----------
-- cron.schedule es idempotente por nombre: reprograma si ya existía.

-- Cuotas: refresco ligero (1X2 + goles) cada 3 horas.
select cron.schedule(
  'refresh-odds-light', '0 */3 * * *',
  $$select public.cron_invoke('refresh-odds', '{"deep": false}'::jsonb)$$
);

-- Cuotas: refresco profundo (+ córners y BTTS) dos veces al día.
select cron.schedule(
  'refresh-odds-deep', '30 6,18 * * *',
  $$select public.cron_invoke('refresh-odds', '{"deep": true}'::jsonb)$$
);

-- Resolución automática de apuestas terminadas, cada hora.
-- Solo gasta créditos de /scores si hay pendientes con el partido ya jugado.
select cron.schedule(
  'settle-bets', '15 * * * *',
  $$select public.cron_invoke('settle-bets')$$
);

-- Posiciones: dos veces al día (no hace nada hasta que exista API_FOOTBALL_KEY).
select cron.schedule(
  'refresh-standings', '45 7,19 * * *',
  $$select public.cron_invoke('refresh-standings')$$
);
