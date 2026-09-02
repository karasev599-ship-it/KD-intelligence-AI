-- KD Messenger message actions + reactions. Intentionally isolated from KD Intelligence.
create table if not exists public.kd_message_reactions (
  message_id uuid not null references public.kd_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (char_length(reaction) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, reaction)
);

create index if not exists kd_message_reactions_message_idx on public.kd_message_reactions(message_id);
alter table public.kd_message_reactions enable row level security;

do $$ begin
  create policy kd_reactions_member_read on public.kd_message_reactions
    for select to authenticated using (
      exists (select 1 from public.kd_messages x where x.id = message_id and public.kd_is_member(x.conversation_id))
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy kd_reactions_self_insert on public.kd_message_reactions
    for insert to authenticated with check (user_id = auth.uid() and exists (
      select 1 from public.kd_messages x where x.id = message_id and public.kd_is_member(x.conversation_id)
    ));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy kd_reactions_self_delete on public.kd_message_reactions
    for delete to authenticated using (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy kd_messages_sender_delete on public.kd_messages
    for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());
exception when duplicate_object then null;
end $$;

alter table public.kd_message_reactions replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.kd_message_reactions;
exception when duplicate_object then null;
end $$;
