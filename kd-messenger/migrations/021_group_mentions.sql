create table if not exists public.kd_message_mentions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.kd_conversations(id) on delete cascade,
  message_id uuid not null references public.kd_messages(id) on delete cascade,
  mentioned_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(message_id, mentioned_user_id)
);

create index if not exists kd_message_mentions_user_idx on public.kd_message_mentions(mentioned_user_id, created_at desc);
create index if not exists kd_message_mentions_conversation_idx on public.kd_message_mentions(conversation_id, created_at desc);

alter table public.kd_message_mentions enable row level security;

drop policy if exists kd_message_mentions_select on public.kd_message_mentions;
drop policy if exists kd_message_mentions_insert on public.kd_message_mentions;

create policy kd_message_mentions_select on public.kd_message_mentions
for select using (
  exists (
    select 1 from public.kd_conversation_members m
    where m.conversation_id = kd_message_mentions.conversation_id
      and m.user_id = auth.uid()
  )
);

create policy kd_message_mentions_insert on public.kd_message_mentions
for insert with check (
  exists (
    select 1
    from public.kd_messages msg
    join public.kd_conversation_members m on m.conversation_id = msg.conversation_id
    where msg.id = kd_message_mentions.message_id
      and msg.sender_id = auth.uid()
      and m.user_id = auth.uid()
      and msg.conversation_id = kd_message_mentions.conversation_id
  )
);

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='kd_message_mentions'
  ) then
    alter publication supabase_realtime add table public.kd_message_mentions;
  end if;
end $$;
