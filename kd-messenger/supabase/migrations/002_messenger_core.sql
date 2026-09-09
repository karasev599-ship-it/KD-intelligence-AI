-- KD Messenger core schema. Keep this database isolated from KD Intelligence.
create extension if not exists pgcrypto;

create table if not exists public.kd_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_]{3,32}$'),
  display_name text not null check (char_length(display_name) between 1 and 64),
  bio text not null default '' check (char_length(bio) <= 160),
  avatar_url text,
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kd_conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct','group')),
  title text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kd_conversation_members (
  conversation_id uuid not null references public.kd_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','admin','owner')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.kd_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.kd_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete restrict,
  body text not null default '' check (char_length(body) <= 10000),
  message_type text not null default 'text' check (message_type in ('text','image','video','file','voice','system')),
  reply_to uuid references public.kd_messages(id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists kd_messages_conversation_created_idx on public.kd_messages(conversation_id, created_at desc);
create index if not exists kd_messages_sender_idx on public.kd_messages(sender_id, created_at desc);
create index if not exists kd_members_user_idx on public.kd_conversation_members(user_id, conversation_id);

alter table public.kd_profiles enable row level security;
alter table public.kd_conversations enable row level security;
alter table public.kd_conversation_members enable row level security;
alter table public.kd_messages enable row level security;

create or replace function public.kd_is_member(cid uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.kd_conversation_members m where m.conversation_id = cid and m.user_id = auth.uid()); $$;

create policy if not exists kd_profiles_read on public.kd_profiles for select to authenticated using (true);
create policy if not exists kd_profiles_self_update on public.kd_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy if not exists kd_profiles_self_insert on public.kd_profiles for insert to authenticated with check (id = auth.uid());

create policy if not exists kd_conversations_member_read on public.kd_conversations for select to authenticated using (public.kd_is_member(id));
create policy if not exists kd_members_member_read on public.kd_conversation_members for select to authenticated using (public.kd_is_member(conversation_id));
create policy if not exists kd_messages_member_read on public.kd_messages for select to authenticated using (public.kd_is_member(conversation_id));
create policy if not exists kd_messages_member_insert on public.kd_messages for insert to authenticated with check (sender_id = auth.uid() and public.kd_is_member(conversation_id));
create policy if not exists kd_messages_sender_update on public.kd_messages for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());

alter table public.kd_messages replica identity full;
