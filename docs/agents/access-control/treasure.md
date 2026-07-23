# Treasure

Treasures are global by default, but may optionally be exclusive to one game via a `game` FK.
All read endpoints are public; write endpoints on the global routes (create and update) remain
restricted to superusers or staff. Treasures may also be associated with games via a separate, untouched
M2M relationship and retrieved through the game-scoped list endpoint below — a treasure can be
M2M-linked to any number of games *and/or* exclusively owned (via `game`) by at most one game,
independently.

| Action | Who can |
|--------|---------|
| List (`GET /treasures.json`) | **AllowAny** — returns only global treasures (`game__isnull=True`); game-exclusive treasures are excluded |
| Detail (`GET /treasures/<id>.json`) | **AllowAny** |
| List by game (`GET /games/<slug>/treasures.json`) | **AllowAny** — returns the union of treasures M2M-linked to that game and treasures whose `game` FK points at it, excluding any whose per-game `GameTreasure.hidden` (see [GameTreasure](game-treasure.md) below) is `True`; 404 if game slug unknown |
| List all by game, including hidden (`GET /games/<slug>/treasures/all.json`) | **GameEdit** — same unfiltered union, without the `GameTreasure.hidden` exclusion, and each item additionally carries a `hidden: boolean` field (via `TreasureAllListSerializer`, a `TreasureListSerializer` subclass used only by this endpoint). Always sets `X-Skip-Cache: true` (stricter than `npcs/all.json`, which relies on cache invalidation instead) |
| Create by game (`POST /games/<slug>/treasures.json`) | **GameEdit** — `game` is set server-side from the resolved game and never accepted from the request body |
| List treasures missing from a game (`GET /games/<slug>/treasures/missing.json`) | **GameEdit** — lists catalog `Treasure` rows (`game__isnull=True`) whose `game_type` matches the game's and that have no `GameTreasure` row yet for this game; paginated, no query-param filters beyond pagination. Always sets `X-Skip-Cache: true` |
| Link an existing treasure to a game (`POST /games/<slug>/treasures/link.json`) | **GameEdit** — creates a `GameTreasure` row for an existing catalog `Treasure` (`treasure_id`/`value`/`hidden`/`max_units` in the request body); 400 when `treasure_id` doesn't resolve, its `game_type` doesn't match the game's, or it is already linked to this game (via M2M or as an exclusive treasure). Distinct from `POST /games/<slug>/treasures.json` above, which creates a brand-new exclusive `Treasure` instead of linking an existing one; responds `201` with the same `TreasureDetailSerializer` shape |
| Detail by game (`GET /games/<slug>/treasures/<int:treasure_id>.json`) | **AllowAny**, unless the treasure's `GameTreasure` row for this game has `hidden=True` — 404 if the treasure's `game` does not match the resolved game (including a global treasure id, or one exclusive to a different game), **and** 404 if the treasure is hidden for this game and the requester cannot edit the game. A hidden treasure's detail is only visible to that game's GameMaster or a superuser; sets `X-Skip-Cache: true` whenever the treasure is hidden |
| Update by game (`PATCH /games/<slug>/treasures/<int:treasure_id>.json`) | **GameEdit** — same 404 rule as the detail endpoint; a `PATCH` by a non-editor on a hidden treasure also 404s (not 403), so existence is not leaked. Also resolves treasures M2M-linked to the game (not just exclusive ones): for an exclusive treasure it updates `name`/`value` and then mirrors the new `value` (always) and `hidden` (only when present in the request body, so a partial update never resets it) onto that treasure's own `GameTreasure` row (`GameTreasure.objects.filter(game=game, treasure=treasure).update(value=treasure.value, ...)`), keeping the two in sync now that reads resolve both from `GameTreasure` — a no-op when no such row exists; for an M2M-linked treasure it instead accepts and persists `max_units` onto that game's `GameTreasure` row — `name`/`value`/`hidden` in the body are ignored in that case, and `acquired_units` can never be set through this endpoint |
| Create (`POST /treasures.json`) | Superuser or Staff |
| Update (`PATCH /treasures/<id>.json`) | Superuser or Staff (includes the GameMaster of a game-exclusive treasure's own owning game — the global endpoint stays superuser-or-staff-only regardless of `game`). When the treasure is exclusive to a game (`game_id` is set), a `hidden` key in the request body is also written onto that treasure's own `GameTreasure` row (mirroring the game-scoped update above); when `game_id` is `None` (a truly global treasure), `hidden` is silently dropped — there is no game to scope it to |
| Create photo (`POST /treasures/<id>/photo_upload.json`) | Superuser or Staff, always; additionally that treasure's owning game's GameMaster, when `treasure.game_id` is set |
| Delete | Superuser only (via Django admin, out of scope) — there is no application-level delete endpoint for treasures at all (only `GET`/`POST` on `treasures_list.py`, `GET`/`PATCH` on `treasure_detail.py`); deletion is Django-admin-only and stays out of scope regardless of this issue. Deleting a treasure's owning `Game` also cascade-deletes the treasure; it does not delete treasures merely M2M-linked to that game |

**Exposed fields** (read): `id`, `name`, `value`, `photo_path`, `game_slug`, `available_units`,
`max_units` — all non-sensitive. `GET /games/<slug>/treasures/all.json` additionally exposes
`hidden` (`boolean`) per item — see the `hidden` section below; no other read endpoint exposes it.

`available_units`/`max_units` (`int|null`) are derived from a `GameTreasure` row (see
[GameTreasure](game-treasure.md) above). Returned, computed relative to the resolved game, on
`GET /games/<slug>/treasures.json`, `GET /games/<slug>/treasures/all.json`, and
`GET /games/<slug>/treasures/<int:treasure_id>.json` (shared `GameTreasureFieldsMixin`). Null on
the global, non-game-scoped endpoints (no game to scope to), and for treasures exclusive to a
game (no `GameTreasure` row exists for those, since `max_units`/`acquired_units` only apply to
the shared M2M relationship).

`value` (`int`) resolves the same way, via the shared `resolve_treasure_value` helper: when a
`game` is present in serializer context and a matching `GameTreasure` row exists for `(game,
treasure)`, `value` is that row's `value`; otherwise it falls back to `Treasure.value` directly.
This applies on the same three game-scoped endpoints listed above (all sharing
`GameTreasureFieldsMixin`), as well as `CharacterTreasureSerializer` (see
[CharacterTreasure](character-treasure.md) above) and the buy/sell cost calculation (see
[GameTreasure](game-treasure.md) above). On the global, non-game-scoped endpoints (`GET
/treasures.json`, `GET /treasures/<id>.json`) there is no `game` in context, so `value` always
falls back to `Treasure.value` — unchanged from prior behavior. Every treasure a game can see
already has a matching `GameTreasure` row (backfilled by migration for pre-existing rows, created
alongside every new linked/exclusive treasure), so the fallback in practice only applies to the
global catalogue.

`photo_path` — see [Photo path fields](common-rules.md#photo-path-fields) above; returned on both `GET /treasures.json` and
`GET /treasures/<id>.json`, to anyone.

`game_slug` is `treasure.game.game_slug` — the slug of the game the treasure is *exclusively*
owned by (via the `game` FK), or `null` when the treasure is global or only M2M-linked to one or
more games. Returned on `GET /treasures.json`, `GET /treasures/<id>.json`, and the game-scoped
list/detail endpoints, to anyone.

**Write fields** (create/update): `name` (required for create, optional for update), `value`
(required for create, optional for update). `photo_path` and `game_slug` are read-only and cannot
be set directly by any client — `game` is only ever assigned server-side, either left `null`
(global create) or set from the `<slug>` URL segment (game-scoped create); `photo_path` is only
ever assigned via [Upload](upload.md) above. `hidden` is accepted in the request body on the
game-scoped endpoints (and the global `PATCH` for an exclusive treasure) but is handled entirely
outside `TreasureCreateSerializer`/`TreasureUpdateSerializer` — see below.

`hidden` (`BooleanField`, default `False`) lives on **`GameTreasure`**, not `Treasure` — it is a
genuinely per-`(game, treasure)` attribute, not a single flag shared across every game a treasure
happens to be linked to (see [GameTreasure](game-treasure.md) below). Because of that,
`TreasureCreateSerializer`/`TreasureUpdateSerializer` (which serialize the `Treasure` model) no
longer include `hidden` in `Meta.fields` at all; the game-scoped views instead extract `hidden`
directly from the raw request body (defaulting to `False` on create) and write it onto the
resolved `GameTreasure` row themselves:
- `POST /games/<slug>/treasures.json` passes `hidden` into the `GameTreasure.objects.create(...)`
  call alongside the new exclusive treasure.
- `PATCH /games/<slug>/treasures/<int:treasure_id>.json` and `PATCH /treasures/<id>.json` (when
  `treasure.game_id` is set) only write `hidden` onto the `GameTreasure` row when the key is
  present in the request body, so a partial update that omits `hidden` never resets it to `False`.

`hidden` is **not** exposed in any read serializer except `GET /games/<slug>/treasures/all.json`'s
`TreasureAllListSerializer` (DM/superuser only) — every other read endpoint (including the
regular `GET /games/<slug>/treasures.json` and `GET /games/<slug>/treasures/<id>.json`) omits it
entirely, both to avoid leaking it to players and because `TreasureListSerializer`/
`TreasureDetailSerializer` are shared with those regular endpoints. Server-side, `hidden` gates:
`GET /games/<slug>/treasures.json` excludes any treasure whose `GameTreasure.hidden` is `True`,
`GET /games/<slug>/treasures/<int:treasure_id>.json` 404s for a hidden treasure unless the
requester can edit the game, `GET /games/<slug>/treasures/all.json` deliberately reveals hidden
treasures (with their `hidden` value) to an authorized DM/superuser, and the buy/NPC-list
endpoints documented under [CharacterTreasure](character-treasure.md) above now also gate on it
(see that doc for the buy 404 and NPC held-treasures filter, plus the three new DM-only
"accept hidden" endpoints). A PC's own treasure listing is unaffected by `hidden` — a PC keeps
seeing treasure it already owns even if that treasure is later hidden from the catalog; the same
applies to a *sell* of a treasure a character already owns, even a hidden one.

**Scope limitation:** since `hidden` now lives on `GameTreasure`, a genuinely global treasure (no
owning/linked game at all) has no `GameTreasure` row and so has no way to be marked hidden — the
global, non-game-scoped endpoints (`POST /treasures.json`, and `PATCH /treasures/<id>.json` when
`treasure.game_id` is `None`) silently drop any `hidden` key from the request body, and the
global list/detail endpoints (`GET /treasures.json`, `GET /treasures/<id>.json`) have no filtering
concept for it at all. This is a deliberate scope decision (only the game-scoped catalog is in
scope for `hidden`), not an oversight — global treasures are already fully public by design (`GET
/treasures.json` is **AllowAny** unconditionally), so this grants no caller any additional access.

## Edit access status

`GET /treasures/<id>/access.json` — **AllowAny**; see [Access status endpoints](common-rules.md#access-status-endpoints-accessjson) above for the
shared response shape. Edit permission is computed via *any* available path: the global
superuser-only route, **or** the game-scoped route (that treasure's owning game's GameMaster,
when `treasure.game_id` is set) — computed separately in `TreasurePermissionsSerializer`, not by
`Treasure.can_be_edited_by` itself (see [Common Rules](common-rules.md) above). The path ends with `/access.json`,
already listed in `frontend/assets/js/client/config/skipCacheSuffixes.js`, so no additional
frontend config is needed.

## Edit permission

`GET /treasures/<id>/permissions.json` — **AllowAny**; see [Edit permission endpoints](common-rules.md#edit-permission-endpoints-permissionsjson) above.
With no `role` param, the real-identity path (`Treasure.can_be_edited_by`) now includes staff
for a global treasure, per the table above. With a `role` param, `can_edit` is computed via
`Treasure.can_be_edited_by_roles(is_superuser, is_dm)` — a global treasure (`game_id` is `None`)
remains superuser-only even under simulation (the `dm` role is always a no-op there, and `staff`
is intentionally not simulated at all — see `parse_role_booleans`'s own docstring); only a
game-exclusive treasure's `dm` role additionally grants `can_edit`, preserving the same
dual-path logic as the real-identity check above. This asymmetry — staff granted for real but
not under `?role=` simulation — is intentional, not a bug.
