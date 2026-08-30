-- pg_cron / pg_net + baja automática de premium al expirar.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.expire_premium()
returns void language sql security definer set search_path = public as $$
  update public.profiles
    set plan = 'free', plan_source = null
    where plan = 'premium'
      and plan_expires_at is not null
      and plan_expires_at < now();
$$;

select cron.schedule('expire-premium-daily', '17 5 * * *', $$select public.expire_premium()$$);
