# KD Messenger — Phase 5 Components

## Core shell

- `AppShell`: responsive mobile/desktop navigation
- `ChatList`: virtualized conversation list with explicit filters
- `ConversationView`: message timeline + composer
- `ProfileView`: KD identity and privacy entry points

## KD-native surfaces

- `SpacesView`: user-created spaces
- `SmartInboxView`: All / Unread / Direct / Groups / Mentions
- `UniversalSearchView`: people, chats, messages, media and files
- `AskKdSheet`: explicit AI action for a selected message range
- `PrivacyCenterView`: sessions, previews, disappearing messages, blocked users, export/delete

## Interaction contract

Every surface must expose loading, empty, offline and error states. Destructive actions require confirmation. AI actions show the selected scope before execution.

## Device contract

Mobile and desktop use the same domain models and backend contracts. Only presentation/navigation differs. No platform-specific fork of message semantics.
