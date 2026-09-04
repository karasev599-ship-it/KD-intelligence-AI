create table if not exists public.kd_ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.kd_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Ответ',
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists kd_ai_messages_conversation_created_idx on public.kd_ai_messages(conversation_id, created_at desc);
alter table public.kd_ai_messages enable row level security;
create policy "ai messages member read" on public.kd_ai_messages for select using (exists (select 1 from public.kd_conversation_members m where m.conversation_id = kd_ai_messages.conversation_id and m.user_id = auth.uid()));
create policy "ai messages own insert" on public.kd_ai_messages for insert with check (auth.uid() = user_id and exists (select 1 from public.kd_conversation_members m where m.conversation_id = kd_ai_messages.conversation_id and m.user_id = auth.uid()));
create policy "ai messages own delete" on public.kd_ai_messages for delete using (auth.uid() = user_id);
