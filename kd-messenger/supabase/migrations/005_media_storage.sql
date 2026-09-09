-- KD Messenger media/files/voice storage. Intentionally isolated from KD Intelligence.
alter table public.kd_messages
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text,
  add column if not exists attachment_size bigint,
  add column if not exists voice_duration integer;

create index if not exists kd_messages_attachment_idx
  on public.kd_messages(attachment_path)
  where attachment_path is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kd-messenger',
  'kd-messenger',
  false,
  52428800,
  array[
    'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
    'application/pdf','text/plain','application/zip',
    'audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

-- Supabase Storage manages RLS on storage.objects; only object policies are added here.
do $$ begin
  create policy kd_messenger_media_read on storage.objects
    for select to authenticated using (
      bucket_id = 'kd-messenger'
      and exists (
        select 1 from public.kd_conversation_members cm
        where cm.conversation_id = split_part(name, '/', 1)::uuid
          and cm.user_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy kd_messenger_media_insert on storage.objects
    for insert to authenticated with check (
      bucket_id = 'kd-messenger'
      and split_part(name, '/', 2)::uuid = auth.uid()
      and exists (
        select 1 from public.kd_conversation_members cm
        where cm.conversation_id = split_part(name, '/', 1)::uuid
          and cm.user_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy kd_messenger_media_delete on storage.objects
    for delete to authenticated using (
      bucket_id = 'kd-messenger'
      and split_part(name, '/', 2)::uuid = auth.uid()
    );
exception when duplicate_object then null;
end $$;
