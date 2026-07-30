# Player

**[Game resource](principles.md#resource-categories).** A `Player` is exposed as a standalone
resource via a roster endpoint and a single-player detail endpoint; otherwise read indirectly
through character data. No write endpoint exists.

Unlike the [default resource CRUD pattern](principles.md#default-resource-crud-pattern)
(List/Detail = `AllowAny`), both endpoints below require Player/GameMaster/Superuser/Staff via
**PlayerPermission** — the same check [Conversation](conversation.md)'s `conversations.json`
endpoint reuses unchanged.

| Action | Who can |
|--------|---------|
| List (`GET /games/<game_slug>/players.json`) | Player, GameMaster, superuser, or staff — **PlayerPermission.check** |
| Show (`GET /games/<game_slug>/players/<id>.json`) | Same as List |
| Create/Update/Delete | Not exposed by any endpoint (Django admin only) |

Standard numbered-page pagination, no filters, ordered by name. Always sets `X-Skip-Cache: true`
per the [`X-Skip-Cache` rule](principles.md#x-skip-cache-rule) (authorization-gated, per-viewer
data).

## Fields
List and Show (same shape): `id`, `user`, `character`.
- `user` — `null` when the `Player` has no linked account. Otherwise: `display_name`
  (`UserProfile.display_name`, never the real username) and `photo_url` (Gravatar-based).
- `character` — `null` for a `Player` who owns no PC (e.g. the DM). Otherwise: `name`,
  `photo_url`. Resolved from the player's first (only) owned PC.

## One PC per Player
`Character.player`, once set, is enforced unique at the database level — a `Player` may own at
most one PC. NPCs/unowned PCs (`player=None`) are unaffected — only non-null `player` values are
constrained.

## GameMaster (DM) role
`Player.is_dm` is the single source of truth for whether a player is that game's DM — there is no
separate `GameMaster` model. A user may hold `is_dm=True` on at most one `Player` row per game, and
may DM multiple games via separate `Player` rows. See [Common Rules](common-rules.md) for how
`is_dm` feeds into `Game.can_be_edited_by`/`Character.can_be_edited_by` and the `access.json`
`is_dm` field.
