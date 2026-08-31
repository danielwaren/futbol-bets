-- El plan free deja de tener 3 ligas fijas: el usuario elige 3 de las 10.
-- Las ligas no elegidas quedan tras el paywall (premium).
-- `free_leagues` NULL = el usuario aún no ha elegido (la app muestra el selector).

alter table public.profiles
  add column if not exists free_leagues text[];

-- Trío por defecto (fallback mientras `free_leagues` sea NULL).
create or replace function public.default_free_leagues()
returns text[] language sql immutable set search_path = '' as $$
  select array['chile','laliga','premier']::text[]
$$;

-- Compat: la antigua free_leagues() sin argumentos = el trío por defecto.
create or replace function public.free_leagues()
returns text[] language sql immutable set search_path = '' as $$
  select array['chile','laliga','premier']::text[]
$$;

-- Ligas free EFECTIVAS de un usuario (su elección, o el trío por defecto).
create or replace function public.free_leagues(uid uuid)
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.free_leagues from public.profiles p where p.id = uid),
    public.default_free_leagues()
  )
$$;

-- Validación: exactamente 3 ligas válidas y distintas, o NULL.
create or replace function public.validate_free_leagues()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.free_leagues is not null then
    if coalesce(array_length(new.free_leagues, 1), 0) <> 3
       or not (new.free_leagues <@ public.all_leagues())
       or exists (
            select 1 from unnest(new.free_leagues) x
            group by x having count(*) > 1
          )
    then
      raise exception
        'free_leagues debe ser exactamente 3 ligas válidas y distintas (recibido: %).',
        new.free_leagues;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_validate_free_leagues on public.profiles;
create trigger profiles_validate_free_leagues
  before insert or update of free_leagues on public.profiles
  for each row execute function public.validate_free_leagues();

-- Las apuestas de un usuario free se limitan a SUS ligas elegidas.
create or replace function public.enforce_bet_plan()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p text := public.current_plan(new.user_id);
begin
  if not (new.league = any(public.all_leagues())) then
    raise exception 'Liga no soportada: %', new.league;
  end if;
  if p = 'free' and not (new.league = any(public.free_leagues(new.user_id))) then
    raise exception
      'La liga % no está en tu selección free. Cámbiala en Cuenta o pásate a premium.',
      new.league;
  end if;
  return new;
end;
$$;

-- Endurecimiento (linter): estas funciones son helpers internos de triggers,
-- no deben ser invocables por el cliente vía /rest/v1/rpc.
revoke execute on function public.free_leagues(uuid) from public, anon, authenticated;
revoke execute on function public.free_leagues() from public, anon, authenticated;
revoke execute on function public.default_free_leagues() from public, anon, authenticated;
revoke execute on function public.validate_free_leagues() from public, anon, authenticated;

-- Los usuarios existentes (incl. el tester) quedan con free_leagues NULL a propósito:
-- la app les mostrará el selector la próxima vez que entren.
