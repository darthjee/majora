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
| `/games/<slug>/items.json` | GET | **AllowAny** | Paginated list of `GameItemListSerializer` objects (`id`, `name`, `photo_path`) for the game's non-hidden items |
| `/games/<slug>/items/all.json` | GET | **GameEdit** | DM-only variant: does not exclude hidden items, and each item additionally carries a `hidden: boolean` field (via `GameItemAllListSerializer`, a `GameItemListSerializer` subclass used only by this endpoint). Always sets `X-Skip-Cache: true` |

Unknown `game_slug` → 404. Both endpoints order by `id`.

**Exposed fields** (read, index): `id`, `name`, `photo_path` — all non-sensitive; `description`
is intentionally omitted from both index endpoints (card/preview UI never renders it — see
`GameItemDetailSerializer` below for where it is exposed). `GET /games/<slug>/items/all.json`
additionally exposes `hidden` — see the `hidden` section below; no other read endpoint exposes
it.

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

There is no acquire/sell flow, or NPC/PC "held item hidden" filter tied to `GameItem.hidden`
itself — see [CharacterItem](character-item.md) below for the separate, per-character `hidden`
flag that governs a PC's/NPC's own held-item list.

## Item detail endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/items/<item_id>.json` | GET | **AllowAny** | `GameItemDetailSerializer` object (`id`, `name`, `photo_path`, `description`) for a single non-hidden item; 404 if the item is hidden or unknown |
| `/games/<slug>/items/<item_id>/all.json` | GET | **GameEdit** | DM-only variant: returns the item even if hidden, and additionally carries `hidden` (via `GameItemDetailAllSerializer`). Always sets `X-Skip-Cache: true` |

Unknown `game_slug` or `item_id` (or an item belonging to a different game) → 404. These mirror
the two index endpoints above in permission/visibility semantics, narrowed to a single row, but
use detail-only serializer subclasses (`GameItemDetailSerializer`/`GameItemDetailAllSerializer`,
each extending the corresponding index serializer) that add `description` back on top of the
lean index fields — no permission class changed. There is still no create/update/delete endpoint
or photo upload for `GameItem` — both remain out of scope.
