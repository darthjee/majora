# Issue: Add session messages

## Description
Add a message board to the game session page (`/#/games/:game_slug/sessions/:id`), letting players and the DM post short text messages tied to that session, visible to anyone with access to the game. Depends on issue #528 (its `email_hash`/`avatar_url` groundwork is assumed to already be implemented).

## Problem
The session page currently has no place for interaction — no way for players and the DM to leave notes, comments, or discussion tied to a specific session.

## Expected Behavior
- **Viewing**: any player of the game, the game's DM, superusers, and staff (`is_staff`) can view a session's messages (both via the endpoint and the UI).
- **Posting**: only a player of that specific game or that game's DM can post a message — no superuser/staff bypass; a superuser who is not also a player or DM of that game cannot post (view-only for them).
- Messages appear in a new section at the bottom of the session page, after the session description, split into two columns:
  - **Left column**: the message list, most recent first, with each message showing its author's name and avatar. A "Load more messages" button appears at the bottom only when there are older messages left to fetch.
  - **Right column**: a small form (message field + submit button) to post a new message.
- Posting a message discards whatever is currently loaded and reloads the list from the most recent page (i.e. any "loaded more" pages are cleared).
- A message stores its text content, a link to the posting `User`, and — only when the poster is a player (not the DM) — a link to that `Player` record.
- Each message in the API payload exposes only a reduced view of its author: `name` and `avatar_url` (no email or other account fields).

## Solution
- **Model**: a new `GameSessionMessage` model — `content` (text), `session` (FK to `GameSession`, related_name `messages`), `user` (FK to `User`), `player` (FK to `Player`, nullable — set only when the poster is a player, left null when the poster is the DM), and a creation timestamp field (`created_at`, `auto_now_add=True`).
- **Endpoints** (REST, following this codebase's existing `.json`-suffixed nested-resource convention rather than the hash-route paths quoted in the original issue description, which describe the *frontend* URL, not the backend one):
  - `GET /games/<game_slug>/sessions/<id>/messages.json` — list messages, paginated (see below). Sets the `X-Skip-Cache` header (matching this codebase's existing casing, not `X-SKIP-CACHE`), since results depend on pagination cursor and change frequently.
  - `POST /games/<game_slug>/sessions/<id>/messages.json` — create a message.
- **Pagination**: a new cursor/ID-based pagination style, ordered by `created_at`/`id` descending:
  - With no `next-entry-id` query param: returns the most recent 20 messages.
  - Response includes a `NEXT-ENTRY-ID` header set to the id of the oldest (last) message in the returned page — empty when there are no older messages left.
  - `?next-entry-id=<id>`: returns the next page of messages with `id <= <id>` (i.e. that message and everything older), continuing the descending list — the boundary message is intentionally repeated as the first item of the new page, so the frontend must skip/dedupe it against what's already rendered.
  - A new frontend component encapsulates this id-cursor pagination style, distinct from the existing numbered-page `Pagination.jsx`.
- **Permissions**: a new permission class following the existing `_EditPermission`-style pattern in `backend/games/permissions.py` — view allowed for `game.players.filter(user=...)`, `game.game_masters.filter(user=...)`, `is_superuser`, or `is_staff`; create allowed only for `game.players.filter(user=...)` or `game.game_masters.filter(user=...)` (no superuser/staff bypass).
- **Avatar URL extraction**: a new dedicated class builds a Gravatar avatar URL from an `email_hash` (wrapping `Settings.gravatar_base_url() + email_hash`, null when there's no hash). `MyAccountDetailSerializer.get_avatar_url` (from #528) is refactored to use this class instead of building the URL inline, and the new message-author serializer reuses the same class — a single source of truth for Gravatar URL construction.
- **Payload shape** (per message):
  ```json
  {
    "id": 1,
    "content": "...",
    "user": { "name": "...", "avatar_url": "..." },
    "created_at": "..."
  }
  ```

## Benefits
- Gives players and DMs a lightweight, session-scoped way to communicate without leaving the app.
- Establishes a reusable cursor-based pagination pattern and a reusable Gravatar-URL-building class for future features.
