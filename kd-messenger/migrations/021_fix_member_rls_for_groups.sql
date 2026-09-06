drop policy if exists kd_member_insert on public.kd_conversation_members;
drop policy if exists kd_member_select on public.kd_conversation_members;
create policy kd_member_select on public.kd_conversation_members for select using (exists(select 1 from public.kd_conversation_members me where me.conversation_id=kd_conversation_members.conversation_id and me.user_id=auth.uid()));
create policy kd_member_insert on public.kd_conversation_members for insert with check (user_id=auth.uid() or exists(select 1 from public.kd_conversation_members me where me.conversation_id=kd_conversation_members.conversation_id and me.user_id=auth.uid() and me.role in ('owner','admin')));
