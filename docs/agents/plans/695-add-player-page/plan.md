# Plan: Add Player page

Issue: [695-add-player-page.md](../issues/695-add-player-page.md)

## Overview

Makes each player card on the existing roster page (`/#/games/:game_slug/players`) a link
into a new single-player detail page (`/#/games/:game_slug/players/:id`), which shows two
compact cards (the player's character and the player themself) plus a paginated list of
conversations shared between the current user and that player. Backend gains a single-player
`GET .../players/:id.json` endpoint (reusing the existing `PlayerListSerializer`) and a
brand-new `GET .../conversations.json?player_id=<id>` endpoint (the `Conversation`/
`ConversationParticipant` models already exist; no urls/views/serializers do). Access to all
three of `players.json`, `players/:id.json`, and `conversations.json` is narrowed to the
game's DM/players only — staff and superuser lose the access `PlayerPermission` currently
grants them, since the issue explicitly excludes them from this feature.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

**`GET /games/:game_slug/players/:id.json`** — single object, same shape as one item of the
existing `GET /games/:game_slug/players.json` list (`PlayerListSerializer`, reused as-is):
```json
{
  "id": 1,
  "user": {"display_name": "...", "photo_url": "..."} ,
  "character": {"name": "...", "photo_url": "..."}
}
```
`user` is `null` if the player has no linked account; `character` is `null` if the player owns
no PC (e.g. the DM). 404 if `player_id` doesn't belong to `game_slug`; permission errors as below.

**`GET /games/:game_slug/conversations.json?player_id=<id>`** — new endpoint, paginated
(standard `Paginator`, same page/per_page contract as `players.json`), new
`ConversationListSerializer`:
```json
{"id": 1, "title": "..."}
```
Ordered most-recent-first (`-id`). Returns conversations where **both** the requesting user's
own `Player` row (in this game) and the `player_id` `Player` row are participants
(`ConversationParticipant`). `player_id` is a required query param for this issue's use case
(the player detail page); a missing/invalid/cross-game `player_id` is a 400.

**Access (both endpoints, and the existing `players.json` list)**: `game.has_player(user)`
only — no staff/superuser bypass. This is a breaking change to `PlayerPermission`, which
today also allows `is_staff`/`is_superuser` (see `backend.md`'s Notes for the conflict this
creates with the project-wide "superusers always have full access" default).

**Cache**: all three endpoints set `X-Skip-Cache: true`.

**Frontend routing**: new hash route `/games/:game_slug/players/:id` → route key
`gamePlayer` → page component `GamePlayer`. `buildPlayerItemHref` in `playersListType.js`
changes from always-`null` to `` `#/games/${gameSlug}/players/${item.data.id}` ``, making
every roster card on the existing list page clickable.
