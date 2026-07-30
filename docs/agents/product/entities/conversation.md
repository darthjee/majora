# Conversation

A **Conversation** (`conversations` app) is a private/group chat with a `title` and an
owning `Player` (`Conversation.owner`). It belongs to no single game directly — its scope is
derived entirely through its participants. A `ConversationParticipant` links a `Conversation`
to a `Player` (one row per player per conversation, `unique_together`); a conversation's
participants are reachable via `Conversation.participants`, and a player's own conversations
via `Player.conversation_participations`/`Player.owned_conversations`. Each participant's
actual chat contributions are `Message` records (`conversation`, `player`, `body`), with
per-recipient read state tracked by `MessageVisualisation` (`message`, `player`, `not_seen`).

`GET /games/:game_slug/conversations.json?player_id=<id>` (issue #695) lists, paginated, the
conversations the requesting user's `Player` shares with `player_id`'s `Player` — i.e. every
`Conversation` where both have a `ConversationParticipant` row — surfacing only `id`/`title`.
`Message` bodies and the full participant list are not exposed by any endpoint yet, reserved
for a future messages feature. See
[access-control/conversation.md](access-control/conversation.md) for the full endpoint and
permission breakdown, including this endpoint's deliberate exclusion of Superuser/Staff.

