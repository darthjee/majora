# Plan: Allow game links edit

Issue: [891-allow-game-links-edit.md](../../issues/891-allow-game-links-edit.md)

## Overview

Add a links-edit modal to the game edit page, mirroring the one PCs already have, and move the
game show page's links list from the right column to the left column, above "Next Session" — the
two land as one unified `{ Show, Edit }` slot, following the pattern PCs already use. This
requires a new `GameLink` write path on the backend (none exists today), and is also the occasion
to split the game update endpoint into `restricted` (dm/admin: `name`+`description`+`links`) and
`regular` (staff/player: `description`+`links` only) tiers, mirroring the `game_pc`/`game_npc`
regular/restricted pattern that already exists for characters.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### `PATCH /games/:game_slug.json`

- **Restricted tier** (dm/admin — via the existing admin/dm shortcut, no config change): body may
  include `name`, `description`, `links`.
- **Regular tier** (staff/player — new): body may include `description`, `links`. A `name` key
  sent by a regular-tier request is silently dropped (not declared on the regular serializer) —
  no 400.
- **`links` entry shape** (both tiers, identical to `CharacterLink`'s write shape):
  ```json
  { "id": 12, "text": "Session notes", "url": "https://...", "link_type": "diary", "delete": false }
  ```
  - `id` — optional; identifies an existing link to update/delete. Omit to create.
  - `text`, `url`, `link_type` — all optional on update (unset ones keep their current value);
    `url` is required when creating (no `id`) and not deleting.
  - `delete` — optional bool, defaults to `false`; `id` is required when `true`.
  - Payload capped at `MAX_LINKS` entries (mirrors `CharacterLinkWriteSerializer`'s cap);
    exceeding it is a 400.
- **Read side is unchanged**: `GameDetailSerializer`'s `links` stays
  `[{ id, text, url, link_type }]`, read-only, via the existing `GameLinkSerializer`.

### Permission flags the frontend depends on

- `GET /permissions/game.json` (`GamePermissionsSerializer`) gains a new `can_edit_regular`
  boolean (action key `regular_edit`), alongside the existing `can_edit` (full/restricted).
  `can_edit` semantics are unchanged (dm/admin only).
- `GET /games/:game_slug/access.json` (`GameAccessSerializer`) already exposes `is_player`/
  `is_staff`/`is_dm`/`is_superuser`/`is_owner`/`is_logged` generically — no backend change needed
  here, the frontend simply isn't fetching it yet for the edit page.
- Frontend reachability rule: a user may reach `GameEdit` when `can_edit || is_player || is_staff`
  is true. Within the page, `isFullEditor = can_edit` gates the `name` field specifically (regular
  editors see it read-only/hidden); everyone who can reach the page can edit `description`/`links`.
