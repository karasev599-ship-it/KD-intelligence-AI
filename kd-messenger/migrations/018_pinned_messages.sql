create table if not exists public.kd_pinned_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.kd_conversations(id) on delete cascade,
  message_id uuid not null references public.kd_messages(id) on delete cascade,
  pinned_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(conversation_id, message_id)
);

create index if not exists kd_pinned_messages_conversation_idx
  on public.kd_pinned_messages(conversation_id, created_at desc);

alter table public.kd_pinned_messages enable row level security;

drop policy if exists "kd_pinned_select_member" on public.kd_pinned_messages;
drop policy if exists "kd_pinned_insert_member" on public.kd_pinned_messages;
drop policy if exists "kd_pinned_delete_member" on public.kd_pinned_messages;

create policy "kd_pinned_select_member"
on public.kd_pinned_messages for select
using (exists (
  select 1 from public.kd_conversation_members m
  where m.conversation_id = kd_pinned_messages.conversation_id
    and m.user_id = auth.uid()
));

create policy "kd_pinned_insert_member"
on public.kd_pinned_messages for insert
with check (
  pinned_by = auth.uid()
  and exists (
    select 1 from public.kd_conversation_members m
    where m.conversation_id = kd_pinned_messages.conversation_id
      and m.user_id = auth.uid()
  )
);

create policy "kd_pinned_delete_member"
on public.kd_pinned_messages for delete
using (exists (
  select 1 from public.kd_conversation_members m
  where m.conversation_id = kd_pinned_messages.conversation_id
    and m.user_id = auth.uid()
));
