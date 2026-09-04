-- 019_saved_messages_notification_modes.sql
-- Persistent saved messages and per-chat notification modes.

create table if not exists public.kd_saved_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid not null references public.kd_messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, message_id)
);

create index if not exists kd_saved_messages_user_created_idx
  on public.kd_saved_messages(user_id, created_at desc);

alter table public.kd_saved_messages enable row level security;

drop policy if exists kd_saved_select on public.kd_saved_messages;
drop policy if exists kd_saved_insert on public.kd_saved_messages;
drop policy if exists kd_saved_delete on public.kd_saved_messages;

create policy kd_saved_select on public.kd_saved_messages
  for select using (auth.uid() = user_id);
create policy kd_saved_insert on public.kd_saved_messages
  for insert with check (auth.uid() = user_id);
create policy kd_saved_delete on public.kd_saved_messages
  for delete using (auth.uid() = user_id);

create table if not exists public.kd_notification_settings (
  conversation_id uuid not null references public.kd_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'normal',
  mute_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id),
  constraint kd_notification_mode_check check (mode in ('normal','quiet','priority'))
);

alter table public.kd_notification_settings enable row level security;

drop policy if exists kd_notification_settings_select on public.kd_notification_settings;
drop policy if exists kd_notification_settings_insert on public.kd_notification_settings;
drop policy if exists kd_notification_settings_update on public.kd_notification_settings;

create policy kd_notification_settings_select on public.kd_notification_settings
  for select using (auth.uid() = user_id);
create policy kd_notification_settings_insert on public.kd_notification_settings
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.kd_conversation_members m
      where m.conversation_id = kd_notification_settings.conversation_id
        and m.user_id = auth.uid()
    )
  );
create policy kd_notification_settings_update on public.kd_notification_settings
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
