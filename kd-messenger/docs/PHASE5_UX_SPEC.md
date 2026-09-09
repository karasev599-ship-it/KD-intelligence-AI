# KD Messenger — Phase 5 UX System

## Navigation

Mobile uses a bottom navigation model: Chats, Spaces, Search, Profile. A compact compose action opens a new conversation or group.

Desktop uses a three-pane layout: navigation/chat list, conversation, contextual details.

## Chat composer

The composer supports text, attachments, reply context, emoji/reactions, voice recording and a clear send action. Drafts are local to each conversation and device until synchronized intentionally.

## Message actions

Long press/right click opens a contextual action sheet: reply, react, copy, edit (own message), delete (permission-aware), forward and Ask KD for the selected message/range.

## Smart Inbox

Filters are explicit and reversible. The user can switch between All, Unread, Direct, Groups and Mentions. Nothing is silently removed from All.

## KD Spaces

A Space is a lightweight container with a title, icon, optional color/theme and selected conversations/saved items. Spaces are not another social feed.

## Ask KD

Ask KD is visible as an action, never an ambient listener. Before processing private content, show what range will be used and what will be produced. The user can cancel.

## Privacy Center

Show active sessions first, then notification preview settings, blocked users, disappearing-message defaults, export and account deletion. Sensitive controls require explicit confirmation.

## Accessibility and performance

- Dynamic text sizes must remain usable.
- Touch targets at least 44 logical pixels.
- Conversation list virtualization for large histories.
- Images loaded progressively with local caching.
- Offline state must be visible rather than silently failing.
