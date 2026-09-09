-- KD Messenger: server-side direct chat creation + realtime support.
-- Intentionally isolated from KD Intelligence.

alter table public.kd_conversations add column if not exists kind text not null default 'direct';
alter table public.kd_conversations add column if not exists title text;
alter table public.kd_conversations add column if not exists created_by uuid references auth.users(id) on delete restrict;
alter table public.kd_conversations add column if not exists updated_at timestamptz not null default now();
alter table public.kd_conversation_members add column if not exists role text not null default 'member';
alter table public.kd_conversation_members add column if not exists last_read_at timestamptz;
alter table public.kd_messages add column if not exists reply_to uuid references public.kd_messages(id) on delete set null;
alter table public.kd_messages add column if not exists deleted_at timestamptz;
alter table public.kd_messages add column if not exists message_type text not null default 'text';

create or replace function public.kd_create_direct_conversation(other_user_id uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare me uuid := auth.uid(); existing_id uuid; new_id uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if other_user_id is null or other_user_id = me then raise exception 'invalid recipient'; end if;
  if not exists (select 1 from public.kd_profiles where id = other_user_id) then raise exception 'recipient profile not found'; end if;
  select c.id into existing_id from public.kd_conversations c
  where c.kind='direct'
    and exists(select 1 from public.kd_conversation_members m where m.conversation_id=c.id and m.user_id=me)
    and exists(select 1 from public.kd_conversation_members m where m.conversation_id=c.id and m.user_id=other_user_id) limit 1;
  if existing_id is not null then return existing_id; end if;
  insert into public.kd_conversations(kind,created_by) values('direct',me) returning id into new_id;
  insert into public.kd_conversation_members(conversation_id,user_id,role) values(new_id,me,'owner'),(new_id,other_user_id,'member');
  return new_id;
end;
$$;

grant execute on function public.kd_create_direct_conversation(uuid) to authenticated;
alter table public.kd_messages replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.kd_messages;
exception when duplicate_object then null;
end $$;
