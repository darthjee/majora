# GameItem

A `GameItem` is a special magic item belonging to exactly one game (`game` FK, `CASCADE`) —
unlike `Treasure`, there is no shared cross-game registry: `GameItem` is the top of the item
hierarchy, holding its own `name`, `description`, and optional `photo` directly (parallel to how
`GameTreasure` merely links a game to a separately-owned `Treasure`, `GameItem` needs no such
through model). It also carries a `hidden` (`BooleanField`, default `False`) flag scoping its
visibility within that game's catalog. There is no dedicated create/update/delete endpoint for
`GameItem` in this issue — it is read-only, via the two index endpoints below (creation/update
and photo upload are explicitly out of scope, left for a follow-up issue).

## Item index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/items.json` | GET | **AllowAny** | Paginated list of `GameItemListSerializer` objects (`id`, `name`, `description`, `photo_path`) for the game's non-hidden items |
| `/games/<slug>/items/all.json` | GET | **GameEdit** | DM-only variant: does not exclude hidden items, and each item additionally carries a `hidden: boolean` field (via `GameItemAllListSerializer`, a `GameItemListSerializer` subclass used only by this endpoint). Always sets `X-Skip-Cache: true` |

Unknown `game_slug` → 404. Both endpoints order by `id`.

**Exposed fields** (read): `id`, `name`, `description`, `photo_path` — all non-sensitive.
`GET /games/<slug>/items/all.json` additionally exposes `hidden` — see the `hidden` section
below; no other read endpoint exposes it.

`photo_path` — see [Photo path fields](common-rules.md#photo-path-fields) above; `null` when the
item has no `photo` set.

## `hidden`

`hidden` lives directly on `GameItem` (not on a separate per-game link row, since `GameItem`
already belongs to exactly one game) — a plain field, default `False`, never inherited by a
`CharacterItem` that links to it (see [CharacterItem](character-item.md) below, whose own
`hidden` is independent). It is:
- Excluded from `GET /games/<slug>/items.json` (the regular catalog list).
- Exposed (per item) only on `GET /games/<slug>/items/all.json`, gated by `GameEditPermission`
  (that game's GameMaster, or a superuser/staff) — the same permission class used by
  `GET /games/<slug>/treasures/all.json`.

There is no detail endpoint, acquire/sell flow, or NPC/PC "held item hidden" filter tied to
`GameItem.hidden` itself — see [CharacterItem](character-item.md) below for the separate,
per-character `hidden` flag that governs a PC's/NPC's own held-item list.
