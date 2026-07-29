# Player

A `Player` is exposed as a standalone resource via a dedicated roster endpoint and a
single-player detail endpoint; it remains otherwise read indirectly through character data. No
write endpoint exists.

Unlike the [default resource CRUD pattern](principles.md#default-resource-crud-pattern) (List/
Detail = `AllowAny`), both endpoints below require Player/GameMaster/Superuser/Staff via
`PlayerPermission`, which mirrors `_is_admin_or_player` (already used by
`PollPermission`'s/`SessionMessagePermission`'s/`PollVotePermission`'s view-only checks).
[Conversation](conversation.md)'s `conversations.json` endpoint reuses the same `PlayerPermission`
unchanged.

| Action | Who can |
|--------|---------|
| List (`GET /games/<game_slug>/players.json`) | Player of the game, that game's GameMaster, or any Superuser/Staff — **PlayerPermission.check**; 401 if unauthenticated, 403 if authenticated but none of the above; 404 if the game slug is unknown |
| Show (`GET /games/<game_slug>/players/<id>.json`) | Player of the game, that game's GameMaster, or any Superuser/Staff — **PlayerPermission.check**; 401/403 as the list endpoint; 404 if the game slug or player id is unknown, or the player id belongs to a different game |
| Create/Update/Delete | Not exposed by any endpoint (Django admin only, out of scope) |

**Pagination**: standard numbered-page `Paginator` (same as `game_treasures`/`game_polls_list`).
No filters. Ordering follows `Player.Meta.ordering` (`['name']`).

**Cache**: `X-Skip-Cache: true` is always set on the response — see
[Common Rules](common-rules.md) for the cache-bypass mechanism, since this is
authorization-gated, per-viewer data.

**Exposed fields** (`PlayerListSerializer`, reused as-is by both List and Show above):
`id`, `user`, `character`.

- `user` (`PlayerUserSerializer`) is `null` when the `Player` has no linked `User` account (a
  named participant with no login identity). Otherwise: `display_name`
  (`UserProfile.display_name`, not the player's real `username`/login credential) and
  `photo_url` (Gravatar-based, same pattern as `SessionMessageUserSerializer`/
  `MyAccountDetailSerializer`; `None` if the user has no email hash).
- `character` (`PlayerCharacterSerializer`) is `null` for a `Player` who owns no PC (e.g. the
  DM). Otherwise: `name` and `photo_url` (`source='profile_photo.path'`, `None` if the
  character has no photo). Resolved via `player.characters.filter(npc=False).first()` — the
  player's first (only, per the `unique_player_character` constraint below) owned PC.

## One PC per Player

`Character.player`, once set (non-null), is enforced unique at the database level via a
plain `UniqueConstraint` (`unique_player_character`, `fields=['player']`) — a `Player` may
own at most one PC. Deliberately **no** `condition=` clause: MySQL (this project's DB) does
not support Django's partial/conditional unique constraints
(`connection.features.supports_partial_indexes` is `False`), so one would silently no-op.
A plain `UniqueConstraint` already achieves the same effect on MySQL without it, since
MySQL's standard unique-index semantics treat every `NULL` as distinct — any number of
NPCs/unowned PCs with `player=None` remain unaffected; only non-null `player` values are
constrained to be unique. This is a schema-only change; no backfill migration is included.

## GameMaster (DM) role

`Player.is_dm` is the single source of truth for whether a player is that game's DM/
GameMaster — there is no separate `GameMaster` model or table. A user may hold `is_dm=True`
on at most one `Player` row per game (one row per game, per the model's constraints), and
may be a DM on multiple games simultaneously via separate `Player` rows. See
[Common Rules](common-rules.md) for how `is_dm` feeds into `Game.can_be_edited_by` /
`Character.can_be_edited_by` and the `access.json` `is_dm` field.
