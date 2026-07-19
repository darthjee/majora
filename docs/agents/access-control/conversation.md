# Conversation (`conversations` app)

`Conversation`, `ConversationParticipant`, `Message`, and `MessageVisualisation`
(`backend/conversations/models/`) model a private/group messaging system between `Player`s.
As of this writing, the `conversations` app has no views/urls/serializers of its own — no
endpoint exposes a conversation's title, messages, or participant list directly. The only
current exposure is indirect and aggregate-only, through [Game](game.md)'s
`GET /my-games.json` ("My Games list" section).

| Action | Who can |
|--------|---------|
| List/Show/Create/Update/Delete a `Conversation`, `Message`, or participant roster | Not exposed by any endpoint (Django admin only, out of scope) |
| Read aggregate counts, via `GET /my-games.json` | Any authenticated user, for their own `ConversationParticipant` rows only — see below |

## Aggregate exposure via `GET /my-games.json`

`MyGamesBuilder` (`backend/games/serializers/games/my_games/_my_games_builder.py`) scopes every
query strictly to the requesting user, and only ever returns two integer counts per game — never
message content, conversation titles, or other participants' identities:

- Conversations considered: `Conversation.objects.filter(participants__player__user=request.user)`
  — only conversations the requester actually has a `ConversationParticipant` row in (i.e.
  follows). A conversation another user participates in, but the requester does not, is never
  counted or referenced.
- `conversations.count` (per game): number of those conversations with at least one
  `ConversationParticipant` whose `Player.game` is that game.
- `conversations.unread_count` (per game): subset of the above with at least one
  `MessageVisualisation` where `player__user == request.user` and `not_seen=True` — i.e. the
  requester's own unread state only; another participant's read/unread state is never read or
  exposed.

No other field of `Conversation`, `Message`, or `MessageVisualisation` is reachable from any
endpoint today.

## Adding a real conversation endpoint

If a future issue adds a `list`/`detail`/`create` endpoint under the `conversations` app (e.g. to
show message bodies), update this file with the same per-action table used by every other
resource in this document set, including:

- Which roles can read a conversation's messages (presumably: its own `ConversationParticipant`s
  only, per the ownership chain already used by `MyGamesBuilder` above).
- Whether `MessageVisualisation.not_seen` can be written by any client (marking a message
  read/unread), and if so, scoped to the caller's own row only.
- Whether the endpoint needs `X-Skip-Cache: true` (very likely yes, being per-viewer data — see
  [Common Rules](common-rules.md#cache-bypass-mechanism-for-access-endpoints)).
