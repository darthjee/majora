# Plan: Add edit NPC page (issue #111)

## Summary

Add an edit page for non-player characters at `/#/games/:game_slug/npcs/:id/edit`, mirroring
the PC edit page shipped in #110 (PR #113), but restricted to superusers only (no player is
ever connected to an NPC). Reuses almost all of #110's infrastructure as-is.

## What #110 already gives us for free

- `Character.can_be_edited_by(user)` (`source/games/models.py`) already returns `True` only
  for a superuser or the connected player's user — for an NPC (`player` is normally `None`),
  this already evaluates to "superuser only" with **no backend model change needed**.
- `CharacterDetailSerializer.can_edit` and `CharacterUpdateSerializer` (`source/games/serializers.py`)
  are not PC-specific — both are usable as-is for NPCs.
- `frontend/assets/js/components/elements/FormField.jsx`, `FieldErrors.jsx`,
  `frontend/assets/js/client/BaseClient.js`, `AuthEvents.js`, `AuthStorage.js` are all reusable
  unchanged.
- `CharacterHelper.render` (the shared show-page renderer for both PC and NPC pages) already
  renders an edit button when `character.can_edit` is true — it just needs its hardcoded
  `/pcs/` edit link fixed to branch on `character.is_pc` (already present in the API response).

## What's missing and needs adding

- `game_npc_detail` (`source/games/views/characters.py`) only supports `GET` — needs the same
  `PATCH` support `game_pc_detail` got, ideally sharing the permission/validation logic via one
  extracted helper instead of duplicating `_update_pc`.
- The frontend's NPC show/load path (`NpcCharacterController.js`) still uses the old unauthenticated
  `client.fetch()` — needs the same authenticated-fetch fix `PcCharacterController.js` got (so
  `can_edit` is computed correctly), via the same `CharacterClient`.
- `CharacterClient.js` only has `fetchPc`/`updatePc` — needs `fetchNpc`/`updateNpc` (or a
  generalized pair of methods reused by both — see frontend.md for the exact shape).
- No NPC edit page/route/controller/helper exist yet.
- No `npc_edit_page` i18n block exists yet.

## Agents involved

- **backend** — `PATCH` on `game_npc_detail`, shared update helper, tests.
- **frontend** — authenticated NPC fetch, `CharacterHelper`'s edit-link fix, new NPC edit
  route/page/controller/helper, `CharacterClient` additions, tests.
- **translator** — `npc_edit_page` i18n block in both `en.yaml` and `pt.yaml`.

## Shared contracts

### `GET /games/<game_slug>/npcs/<id>.json` (existing endpoint, no shape change)

Already returns `can_edit` (added in #110, generic to both PC/NPC) — for an NPC this is `true`
only for an authenticated superuser. Frontend must send `Authorization: Token <token>` on this
GET (same as the PC show page does) for `can_edit` to be computed correctly.

### `PATCH /games/<game_slug>/npcs/<id>.json` (new method on the existing endpoint)

Identical contract to the PC one from #110 — request requires `Authorization: Token <token>`,
body is a partial `{name, avatar_url, character_class, level, description}`, responses are
`401`/`403`/`400`/`200` with the exact same shapes as documented in #110's plan
(`docs/agents/plans/110-add-edit-pc-page/plan.md`, now removed from the repo post-merge, but
mirrored verbatim in [backend.md](backend.md) here).

### Frontend route

New hash route `/games/:game_slug/npcs/:character_id/edit` → page key `npcCharacterEdit`.

### i18n

New `npc_edit_page` block, structurally identical to the existing `pc_edit_page` block (same
key names), so `NpcCharacterEditHelper` can be a near line-for-line copy of
`PcCharacterEditHelper` with `pc_edit_page` swapped for `npc_edit_page`.

## CI checks

- Backend: `docker-compose run --rm majora_tests pytest source/games` and
  `docker-compose run --rm majora_be ruff check source/`.
- Frontend: `docker-compose run --rm majora_fe yarn lint` and
  `docker-compose run --rm majora_fe yarn test`.
- Translator: `docker-compose run --rm majora_fe yarn check_i18n`.

See [backend.md](backend.md), [frontend.md](frontend.md), and [translator.md](translator.md)
for the per-agent breakdown.
