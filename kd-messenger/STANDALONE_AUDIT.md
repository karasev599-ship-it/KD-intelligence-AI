# KD Messenger standalone — architecture audit

Date: 2026-10-10
Working branch: kd-messenger-standalone

## Verified findings

- The repository root `index.html` is the KD Intelligence trading dashboard, not a Messenger entry point.
- There is no `kd-messenger/index.html` or `kd-messenger/style.css` on the current branch.
- `kd-messenger/ai-media.js` is a loader/augmenter, not the complete Messenger application. It expects an existing Messenger DOM and an already available Supabase JS global.
- The loader fetches a pinned copy of itself from jsDelivr, then loads profile/stories, chat-profile UI, and calls modules using paths rooted at the current page. Those assumptions break when hosted as a standalone app from a different root.
- `profile-stories.js` explicitly waits for existing Messenger DOM selectors; it adds profile/story features rather than rendering the conversation list and chat shell.
- `calls.js` adds a call overlay and uses the shared Supabase client. TURN configuration is optional via `window.KD_TURN_SERVERS`; only STUN fallback is present by default.
- The root `app.js` does not contain obvious Messenger core references, so the core chat shell must be located in another file or was not committed to this repository path. It would be unsafe to create a deployment-ready standalone shell by pretending the existing modules are a complete app.

## Safe migration sequence

1. Locate the actual conversation-list/chat-shell source and its styles.
2. Add a standalone entry point under `kd-messenger/` that initializes Supabase Auth/client itself.
3. Convert module loading to local, relative paths and remove the self-referential CDN loader.
4. Verify login/session restore, conversation membership, messages, media, stories, and calls against the existing Supabase project.
5. Configure a separate hosting project with root directory `kd-messenger`; do not alter the trading dashboard entry point.

## Security/deployment notes

- Keep using only the public Supabase anon/publishable key in browser code. Never place a service-role key in the frontend.
- A separate frontend deployment can share the existing Supabase backend; this does not mean the backend is isolated.
- No public Messenger deployment URL or browser end-to-end test is claimed by this audit.
