-- El plan free elige sus 3 ligas UNA vez. Cambiarlas es una función premium:
-- si se pudieran cambiar libremente, las 10 ligas serían gratis por turnos y
-- el plan premium perdería su razón de ser.
--
-- Regla: en free, free_leagues solo puede pasar de NULL a un valor.
-- En premium se puede cambiar cuantas veces se quiera.

create or replace function public.protect_free_leagues()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- service_role (edge functions) y conexiones directas (migraciones) pasan.
  if auth.role() is null or auth.role() = 'service_role' then
    return new;
  end if;

  if old.free_leagues is distinct from new.free_leagues
     and old.free_leagues is not null
     and public.current_plan(new.id) <> 'premium'
  then
    raise exception
      'Cambiar de ligas es una función Premium. Tu selección actual se mantiene.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_free_leagues on public.profiles;
create trigger profiles_protect_free_leagues
  before update of free_leagues on public.profiles
  for each row execute function public.protect_free_leagues();

revoke execute on function public.protect_free_leagues() from public, anon, authenticated;
