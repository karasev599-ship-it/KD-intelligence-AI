-- KD Messenger is intentionally isolated from KD Intelligence.

create table if not exists public.kd_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-zA-Z0-9_]{3,32}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  bio text,
  last_seen timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.kd_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.kd_conversation_members (
  conversation_id uuid not null references public.kd_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.kd_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.kd_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  message_type text not null default 'text',
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists kd_messages_conversation_created_idx on public.kd_messages(conversation_id, created_at);
create index if not exists kd_members_user_idx on public.kd_conversation_members(user_id);

alter table public.kd_profiles enable row level security;
alter table public.kd_conversations enable row level security;
alter table public.kd_conversation_members enable row level security;
alter table public.kd_messages enable row level security;

create policy "profiles readable by authenticated users" on public.kd_profiles for select to authenticated using (true);
create policy "users create own profile" on public.kd_profiles for insert to authenticated with check (auth.uid() = id);
create policy "users update own profile" on public.kd_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "members can read conversations" on public.kd_conversations for select to authenticated using (
  exists (select 1 from public.kd_conversation_members m where m.conversation_id = id and m.user_id = auth.uid())
);
create policy "members can read membership" on public.kd_conversation_members for select to authenticated using (
  user_id = auth.uid() or exists (select 1 from public.kd_conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
);
create policy "members can read messages" on public.kd_messages for select to authenticated using (
  exists (select 1 from public.kd_conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
);
create policy "members can send messages" on public.kd_messages for insert to authenticated with check (
  sender_id = auth.uid() and exists (select 1 from public.kd_conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
);
