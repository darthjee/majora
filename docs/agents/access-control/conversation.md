# Conversation (`conversations` app)

**[Game resource](principles.md#resource-categories)** (routed/viewed/serialized from the `games`
app, per [`views-organization.md`](../views-organization.md)). `Conversation`,
`ConversationParticipant`, `Message`, and `MessageVisualisation` model a private/group messaging
system between `Player`s. The one real endpoint, `GET /games/<game_slug>/conversations.json`,
exposes a `Conversation`'s `id`/`title` only. `Message`/`MessageVisualisation` remain unexposed by
any endpoint — reserved for a future messages issue. The aggregate-only exposure through
[Game](game.md)'s `GET /my-games.json` is separate and unaffected.

Unlike the [default resource CRUD pattern](principles.md#default-resource-crud-pattern),
`conversations.json` requires Player/GameMaster/Superuser/Staff via **PlayerPermission** — the
same check [Player](player.md)'s endpoints use.

| Action | Who can |
|--------|---------|
| List conversations shared between two players (`GET /games/<game_slug>/conversations.json?player_id=<id>`) | Player, GameMaster, superuser, or staff — **PlayerPermission.check**; `400` if `player_id` missing/invalid; `404` if `player_id` doesn't belong to `game_slug` |
| Show/Create/Update/Delete a `Conversation`, `Message`, or participant roster | Not exposed (Django admin only) |
| Read aggregate counts, via `GET /my-games.json` | Any authenticated user, for their own rows only — see below |

## `GET /games/<game_slug>/conversations.json`
Paginated, most-recent-first, returns only `Conversation`s where **both** the requester's own
`Player` row (in `game_slug`) and the `player_id` query param's `Player` row participate — no way
to browse a third party's conversations via this filter. `player_id` is required, not optional.

**Fields**: `id`, `title` only — no participant list or message preview (reserved for a future
messages issue). Always sets `X-Skip-Cache: true` per the [`X-Skip-Cache`
rule](principles.md#x-skip-cache-rule).

## Aggregate exposure via `GET /my-games.json`
Every query is scoped strictly to the requesting user, returning only two integer counts per
game — never message content, titles, or other participants' identities: `conversations.count`
(conversations the requester follows with at least one participant in that game) and
`conversations.unread_count` (subset with at least one unread message for the requester). No field
of `Message`/`MessageVisualisation` is reachable from any endpoint today.

## Adding a real conversation endpoint
If a future issue adds a `detail`/`create` endpoint exposing message bodies, update this file with
the same per-action table used elsewhere in this document set, including: which roles can read a
conversation's messages (presumably its own participants only), whether
`MessageVisualisation.not_seen` is writable (scoped to the caller's own row only if so), whether
`X-Skip-Cache: true` is needed (very likely yes), and whether the Superuser/Staff exclusion
documented above should carry over.
