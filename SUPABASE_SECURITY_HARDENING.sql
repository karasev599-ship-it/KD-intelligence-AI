-- KD Messenger / Supabase security hardening
-- Applied to production on 2026-09-15.
-- These RPCs are user-facing and require an authenticated session.
-- Remove the default PUBLIC EXECUTE privilege so anonymous callers cannot invoke
-- SECURITY DEFINER functions through the Data API.

revoke execute on function public.kd_close_group_poll(uuid) from public;
revoke execute on function public.kd_create_group_poll(uuid, text, text[], boolean) from public;
revoke execute on function public.kd_group_log_event(uuid, text, uuid, text, text) from public;
revoke execute on function public.kd_group_update_profile(uuid, text, text, text) from public;
revoke execute on function public.kd_set_group_poll_votes(uuid, uuid[]) from public;

grant execute on function public.kd_close_group_poll(uuid) to authenticated;
grant execute on function public.kd_create_group_poll(uuid, text, text[], boolean) to authenticated;
grant execute on function public.kd_group_log_event(uuid, text, uuid, text, text) to authenticated;
grant execute on function public.kd_group_update_profile(uuid, text, text, text) to authenticated;
grant execute on function public.kd_set_group_poll_votes(uuid, uuid[]) to authenticated;
