-- Monetización: auditoría de eventos + blindaje de las columnas de plan.

create table public.subscription_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  app_user_id text,
  event_type text,
  store text,
  entitlement text,
  expires_at timestamptz,
  raw jsonb,
  received_at timestamptz not null default now()
);
create index subscription_events_user_idx
  on public.subscription_events (user_id, received_at desc);
alter table public.subscription_events enable row level security;
-- sin políticas: solo service role (edge functions)

-- El cliente NO puede tocar plan / plan_source / plan_expires_at.
-- Solo el backend (service_role) o una conexión directa (migraciones).
create or replace function public.protect_profile_plan()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.role() is null or auth.role() = 'service_role' then
    return new;
  end if;
  new.plan := old.plan;
  new.plan_source := old.plan_source;
  new.plan_expires_at := old.plan_expires_at;
  return new;
end;
$$;

create trigger profiles_protect_plan
  before update on public.profiles
  for each row execute function public.protect_profile_plan();

revoke execute on function public.protect_profile_plan() from public, anon, authenticated;
