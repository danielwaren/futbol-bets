-- Endurecimiento sugerido por el linter de seguridad de Supabase.

alter function public.free_leagues() set search_path = '';
alter function public.all_leagues() set search_path = '';

-- Funciones de trigger / helpers: no deben ser invocables por RPC.
revoke execute on function public.handle_new_user()       from public, anon, authenticated;
revoke execute on function public.enforce_bankroll_plan() from public, anon, authenticated;
revoke execute on function public.enforce_bet_plan()      from public, anon, authenticated;
revoke execute on function public.expire_premium()        from public, anon, authenticated;
revoke execute on function public.current_plan(uuid)      from public, anon, authenticated;
revoke execute on function public.free_leagues()          from public, anon, authenticated;
revoke execute on function public.all_leagues()           from public, anon, authenticated;
