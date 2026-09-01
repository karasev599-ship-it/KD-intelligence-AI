# KD Messenger — Standalone App Architecture

KD Messenger is a standalone product in the KD Ecosystem. It has no runtime dependency on KD Intelligence.

## Product boundaries
- Separate app repository path: `kd-messenger/`
- Separate Supabase project/backend
- Separate deployment
- Separate release cycle
- Future shared KD Account is optional and must not couple product runtimes

## Client targets
- iOS / iPadOS
- Android
- macOS
- Windows

## MVP client stack
Flutter + Dart, with platform-native push notification integrations.

## Backend
- Supabase Auth for identity
- Postgres for profiles, conversations, members and messages
- Storage for media/files
- Realtime for message delivery and presence
- Row Level Security for private data

## Core flows
1. Sign up / sign in
2. Create profile and unique `@username`
3. Search users
4. Start direct conversation
5. Send/receive messages in realtime
6. Attach media/files
7. Push notification when app is inactive
8. Profile, privacy and session settings

## Mobile navigation
Chats / Contacts / Calls / Profile.

## Desktop navigation
Three-pane layout: chat list / conversation / profile-details panel.

## Brand
KD Messenger uses a dedicated KD Messenger icon/avatar and splash screen. Do not reuse KD Intelligence UI as a runtime dependency.

## Security requirements
- TLS everywhere
- Auth tokens managed by the client SDK
- No plaintext passwords in application tables
- RLS on all private tables
- Membership checks for conversation reads/writes
- Session/device management
- Account deletion flow

## Roadmap
MVP: auth, profile, username search, direct chat, realtime, responsive UI.
MVP2: reactions, reply/edit/delete, media, files, voice messages, push.
MVP3: groups, roles, calls/video calls, 2FA, multi-device controls.
