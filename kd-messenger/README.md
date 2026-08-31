# KD Messenger

Standalone Messenger project. It is intentionally isolated from the production KD Intelligence application.

## Current prototype

- Responsive desktop layout for Mac/PC.
- Responsive mobile layout for iPhone/Android.
- Chat list and search.
- Local demo conversations.
- New-chat UI.
- Local theme persistence.
- Message reactions.
- Local browser state for prototype interactions.

## Backend plan

The next implementation layer uses Supabase Auth + Postgres + Realtime on the dedicated Messenger backend.

Core entities:

- `profiles` — public user profile and `@username`.
- `conversations` — direct chats, groups and channels.
- `conversation_members` — membership, roles, read/mute state.
- `messages` — text and attachment metadata.
- `message_reactions` — emoji reactions.
- `message_reads` — read receipts.

`backend/schema.sql` contains the isolated database foundation and RLS policies.

## Product sequence

1. Auth and profile creation.
2. Unique `@username` and user search.
3. Real direct chats.
4. Realtime messages and typing/presence.
5. Groups and admin roles.
6. Image/file uploads.
7. Voice messages.
8. Push notifications.
9. Calls.
10. End-to-end encryption design review before production messaging.

## Isolation rule

Do not modify or import the production KD Intelligence application from this folder. Messenger should have its own deployment and its own backend project until an explicit integration step is requested.
