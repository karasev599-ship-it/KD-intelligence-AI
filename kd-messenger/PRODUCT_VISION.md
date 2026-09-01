# KD Messenger — Product Vision

KD Messenger is a standalone communication product inside KD Ecosystem. It is not a module of KD Intelligence.

## Product goal

Build a polished consumer messenger that can realistically compete with the usability of Telegram/WhatsApp while adding a distinctive KD experience.

## North-star principles

- Fast first: opening a chat and sending a message should feel instant.
- Private by design: least-privilege backend policies, secure sessions, explicit device management.
- Cross-device continuity: the same account behaves consistently on phone and desktop.
- Media-first: photos, video, documents, voice notes and previews are first-class messages.
- Human UI: familiar interaction patterns without copying another messenger's branding.
- Extensible core: groups, calls, channels and richer features must fit the architecture without rewrites.

## Differentiating ideas

### KD Profile

A compact identity card with username, avatar, status, bio and optional verified/official marker.

### Smart Chat

A conversation can surface useful context: pinned messages, shared media, files, links and search without leaving the chat.

### Focus modes

Per-chat notification modes: normal, quiet, priority and temporary mute.

### Message actions

Reply, edit, delete, forward, react, copy, save, pin and mark unread. Long-press on mobile and context menu on desktop.

### Saved space

A private "Saved" conversation for notes, links, documents and forwarded messages.

### Multi-device

A visible Devices screen with active sessions, last activity and one-tap session termination.

## Delivery phases

### Phase A — Real messenger core

Auth, profiles, username search, one-to-one conversations, message persistence, realtime updates, unread counts and read state.

### Phase B — Daily driver

Photos, video, files, voice messages, replies, reactions, editing, deletion, pinning, search and push notifications.

### Phase C — Social layer

Groups, roles, invite links, mentions, polls, channels and moderation tools.

### Phase D — Communication suite

Audio/video calls, screen sharing and multi-device call handoff.

### Phase E — KD differentiators

Smart chat context, richer Saved space, advanced privacy controls, themes and optional AI-assisted features that are explicitly user-invoked.

## Non-goals

- Do not connect Messenger runtime to KD Intelligence.
- Do not copy Telegram/WhatsApp UI pixel-for-pixel.
- Do not ship fake realtime as if it were production functionality.
- Do not put service secrets in the client repository.
