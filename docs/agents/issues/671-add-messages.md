# Issue: Add messages

## Description
Add a new backend-only "conversations" feature: a private/group messaging system between players, independent from the existing per-`GameSession` live chat log (`GameSessionMessage`). Both will coexist as separate, parallel systems.

This issue covers models and migrations only — no API endpoints, serializers, views, or frontend. Those will come in a future issue.

A new top-level Django app named `conversations` is added to `INSTALLED_APPS`, mirroring how `statistics` and `games` are structured as sibling apps (not nested inside `games`). It cannot be named `messages`, since that app label is already taken by `django.contrib.messages`.

Since a `games.Player` belongs to exactly one game (a user playing in multiple games has one `Player` row per game), and both the Conversation owner and its participants link to `Player` (not `User`), a Conversation ends up implicitly scoped to a single game. This is intentionally *not* enforced at the database level in this issue — there is no `game` FK on `Conversation` and no constraint tying participants to a shared game. Any such validation is left to a future API layer.

## Expected Behavior
After this change: the new `conversations` app exists with its own `models/` package and `migrations/` folder, registered in `INSTALLED_APPS`; running migrations creates the four new tables (`Conversation`, `ConversationParticipant`, `Message`, `MessageVisualisation`) with the relations described above; no existing `games`/`statistics` functionality or API surface is affected.

## Solution
New models, all in the new `conversations` app:

### Conversation
- `title`: CharField
- `owner`: ForeignKey to `games.Player`

### ConversationParticipant
- `conversation`: ForeignKey to `Conversation`
- `player`: ForeignKey to `games.Player`
- Join table connecting a player to a conversation they participate in.

### Message
- `conversation`: ForeignKey to `Conversation`
- `player`: ForeignKey to `games.Player` (the sender)
- `body`: TextField

### MessageVisualisation
- `message`: ForeignKey to `Message`
- `player`: ForeignKey to `games.Player`
- `not_seen`: BooleanField

Lifecycle: a `MessageVisualisation` row is created only once a participant actually views the message (its existence implies "seen"). The `not_seen` flag lets that same row be explicitly flipped back to mark the message as unread again. The absence of a row for a given player/message pair means the message has never been opened by that player.

None of these four models get `HistoricalRecords`/versioning tracking, consistent with the existing precedent that message/chat-like models (e.g. `GameSessionMessage`) are excluded from history tracking in this codebase.

## Benefits
Lays the backend groundwork for a future direct/group-messaging feature between players, kept decoupled from the `games` app and from the existing per-session `GameSessionMessage` chat log.
