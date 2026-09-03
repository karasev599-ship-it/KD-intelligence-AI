-- KD Messenger backend foundation
-- Apply this schema only to the dedicated Messenger Supabase project.
-- It is intentionally independent from KD Intelligence.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default 'KD User',
  avatar_url text,
  bio text,
  is_online boolean not null default false,
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct','group','channel')),
  title text,
  username text unique,
  avatar_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  muted_until timestamptz,
  primary key (conversation_id,user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  message_type text not null default 'text' check (message_type in ('text','image','video','file','voice','system')),
  attachment_url text,
  attachment_name text,
  attachment_size bigint,
  reply_to_id uuid references public.messages(id) on delete set null,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (char_length(reaction) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id,user_id,reaction)
);

create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id,user_id)
);

create index if not exists messages_conversation_created_idx
  on public.messages(conversation_id, created_at desc);
create index if not exists conversation_members_user_idx
  on public.conversation_members(user_id);
create index if not exists profiles_username_lower_idx
  on public.profiles(lower(username));

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at
before update on public.conversations
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'username',''),
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(coalesce(new.email,'KD User'),'@',1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_reads enable row level security;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = auth.uid()
  );
$$;

create policy if not exists profiles_read on public.profiles
for select to authenticated using (true);
create policy if not exists profiles_update_own on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy if not exists conversations_read_member on public.conversations
for select to authenticated using (public.is_conversation_member(id));
create policy if not exists conversations_create on public.conversations
for insert to authenticated with check (created_by = auth.uid());
create policy if not exists conversations_update_admin on public.conversations
for update to authenticated using (
  exists (select 1 from public.conversation_members cm
          where cm.conversation_id = id and cm.user_id = auth.uid()
            and cm.role in ('owner','admin'))
);

create policy if not exists members_read_member on public.conversation_members
for select to authenticated using (public.is_conversation_member(conversation_id));
create policy if not exists members_add on public.conversation_members
for insert to authenticated with check (
  user_id = auth.uid() or exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
      and cm.role in ('owner','admin')
  )
);
create policy if not exists members_update_admin on public.conversation_members
for update to authenticated using (
  exists (select 1 from public.conversation_members cm
          where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
            and cm.role in ('owner','admin'))
);
create policy if not exists members_leave_or_admin_delete on public.conversation_members
for delete to authenticated using (
  user_id = auth.uid() or exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversation_id and cm.user_id = auth.uid()
      and cm.role in ('owner','admin')
  )
);

create policy if not exists messages_read_member on public.messages
for select to authenticated using (public.is_conversation_member(conversation_id));
create policy if not exists messages_send_member on public.messages
for insert to authenticated with check (
  sender_id = auth.uid() and public.is_conversation_member(conversation_id)
);
create policy if not exists messages_edit_own on public.messages
for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());
create policy if not exists messages_delete_own on public.messages
for delete to authenticated using (sender_id = auth.uid());

create policy if not exists reactions_read_member on public.message_reactions
for select to authenticated using (
  exists (select 1 from public.messages m where m.id = message_id and public.is_conversation_member(m.conversation_id))
);
create policy if not exists reactions_write_own on public.message_reactions
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy if not exists reads_read_own on public.message_reads
for select to authenticated using (user_id = auth.uid());
create policy if not exists reads_write_own on public.message_reads
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Realtime: messages, reactions and read receipts can be subscribed to later.
do $$ begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.message_reactions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.message_reads; exception when duplicate_object then null; end;
end $$;
