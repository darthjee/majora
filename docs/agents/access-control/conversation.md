# Conversation (`conversations` app)

`Conversation`, `ConversationParticipant`, `Message`, and `MessageVisualisation`
(`backend/conversations/models/`) model a private/group messaging system between `Player`s.
As of issue #695, the `conversations` app gains its first real endpoint,
`GET /games/<game_slug>/conversations.json` (routed/viewed/serialized from the `games` app,
per `views-organization.md` — see [Adding a real conversation endpoint](#adding-a-real-conversation-endpoint)
below), exposing a `Conversation`'s `id`/`title` (nothing else). `Message`/
`MessageVisualisation` remain unexposed by any endpoint — reserved for a future messages
issue referenced by #695. The pre-existing aggregate-only exposure through [Game](game.md)'s
`GET /my-games.json` is unchanged.

> **Access-control exception (issue #695):** contrary to `access-control.md`'s top-level
> default ("Superusers always have full access to everything, regardless of any other rule
> listed below"), **Superuser and Staff (`is_staff`) are explicitly excluded** from
> `conversations.json`. This mirrors the same deliberate exception made for
> [Player](player.md)'s `players.json`/`players/:id.json` — staff/superuser have no
> legitimate reason to browse a player's conversations. Both endpoints share the same
> `PlayerPermission.check` (`game.has_player(user)` only, no bypass). Do not "fix" this back
> to the default in a future change.

| Action | Who can |
|--------|---------|
| List conversations shared between two players (`GET /games/<game_slug>/conversations.json?player_id=<id>`) | Player of the game, or that game's GameMaster — **PlayerPermission.check** (no Superuser/Staff bypass, see above); 401 if unauthenticated, 403 if authenticated but neither of the above; 400 if `player_id` is missing or not a valid integer; 404 if the game slug is unknown, or `player_id` doesn't belong to `game_slug` |
| Show/Create/Update/Delete a `Conversation`, `Message`, or participant roster | Not exposed by any endpoint (Django admin only, out of scope) |
| Read aggregate counts, via `GET /my-games.json` | Any authenticated user, for their own `ConversationParticipant` rows only — see below |

## `GET /games/<game_slug>/conversations.json`

Returns, paginated (standard numbered-page `Paginator`, same contract as
`game_players`/`game_treasures`) and ordered most-recent-first (`-id`), the `Conversation`s
where **both** the requesting user's own `Player` row (in `game_slug`) and the `player_id`
query param's `Player` row have a `ConversationParticipant` row — i.e. only conversations the
two players actually share. There is no way to browse a third party's conversations via this
filter: a conversation only the requester is in (not `player_id`), or only `player_id` is in
(not the requester), is excluded either way. `player_id` is a required query param for this
issue's use case (the player detail page); it is not optional.

**Serializer** (`ConversationListSerializer`): `id`, `title` only — no participant list, no
last-message preview, since the right-hand message panel and richer conversation data are
explicitly out of scope (reserved for the future messages issue referenced in #695).

**Cache**: `X-Skip-Cache: true` is always set — see
[Common Rules](common-rules.md#cache-bypass-mechanism-for-access-endpoints), since this is
authorization-gated, per-viewer data.

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

No field of `Message` or `MessageVisualisation` is reachable from any endpoint today (only
`Conversation.id`/`title`, via `conversations.json` above, plus the aggregate counts above).

## Adding a real conversation endpoint

`conversations.json` (issue #695) only lists a conversation's `id`/`title` between two known
players — it does not expose messages. If a future issue adds a `detail`/`create` endpoint
under the `conversations` app (e.g. to show message bodies), update this file with the same
per-action table used by every other resource in this document set, including:

- Which roles can read a conversation's messages (presumably: its own `ConversationParticipant`s
  only, per the ownership chain already used by `MyGamesBuilder` above and `conversations.json`'s
  `PlayerPermission` check).
- Whether `MessageVisualisation.not_seen` can be written by any client (marking a message
  read/unread), and if so, scoped to the caller's own row only.
- Whether the endpoint needs `X-Skip-Cache: true` (very likely yes, being per-viewer data — see
  [Common Rules](common-rules.md#cache-bypass-mechanism-for-access-endpoints)).
- Whether the same Superuser/Staff exclusion documented above for `conversations.json` should
  carry over, or whether messages warrant a different rule.
