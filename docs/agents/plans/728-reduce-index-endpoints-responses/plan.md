# Plan: Reduce index endpoints responses

Issue: [728_reduce-index-endpoints-responses.md](../../issues/728-reduce-index-endpoints-responses.md)

## Overview

`GameItemListSerializer` and `CharacterItemSerializer` are each currently reused, unmodified,
for both the index/list view and the single-item detail view of their resource, so both
leak `description` into index responses where the frontend never renders it. Game, Treasure,
and Character (PC/NPC) index serializers already exclude description-type fields and need no
changes. This plan splits the two Item serializers into lean index (+ index-all) variants and
new detail (+ detail-all) variants that keep `description`, rewiring only the four detail
views (game item detail/detail-all, PC/NPC item detail/detail-all) to the new detail
serializers. Index and index-all views are unaffected — they already point at the base
classes, which become lean automatically.

## Context

Investigated during `/discuss-issue #728`:
- `Game` (`GameListSerializer`), `Treasure` (`TreasureListSerializer`/`TreasureDetailSerializer`,
  no `description` field on the model at all), and `Character`
  (`CharacterListSerializer`/`CharacterFullListSerializer`) index serializers are already
  minimal — out of scope.
- `GameItem` and `CharacterItem` are the only resources whose index responses currently
  include `description`, because their list serializer is reused verbatim for the
  single-item detail endpoint.
- The `*AllListSerializer`/`*AllSerializer` variants (via `HiddenFieldMixin`) already add only
  `hidden` on top of the base index serializer — this plan follows that same
  inheritance pattern to add a `Detail` and `DetailAll` pair per resource.

## Implementation Steps

### Step 1 — Split `GameItem` serializers

File: `backend/games/serializers/games/items/game_item_list.py`

- Trim `GameItemListSerializer.Meta.fields` to `['id', 'name', 'photo_path']` (drop
  `description`).
- Add `GameItemDetailSerializer(GameItemListSerializer)`, whose `Meta` extends the parent's
  `fields` with `['description']` (mirrors how `GameItemAllListSerializer` already extends
  the base with `['hidden']`).
- Add `GameItemDetailAllSerializer(HiddenFieldMixin, GameItemDetailSerializer)`, whose `Meta`
  extends `GameItemDetailSerializer.Meta.fields` with `['hidden']`.
- `GameItemAllListSerializer` itself needs no field changes — since it extends the now-lean
  `GameItemListSerializer`, it automatically stops including `description` while still
  adding `hidden`.

Export `GameItemDetailSerializer` and `GameItemDetailAllSerializer` from
`backend/games/serializers/__init__.py` alongside the existing `GameItemAllListSerializer`/
`GameItemListSerializer` entries (both the import and the `__all__` list).

### Step 2 — Split `CharacterItem` serializers

File: `backend/games/serializers/characters/character_item.py`

- Trim `CharacterItemSerializer.Meta.fields` to `['id', 'game_item_id', 'name', 'photo_path']`
  (drop `description`). Leave the `description = serializers.SerializerMethodField()`
  declaration and `get_description` method in place — they become unused by the base
  class's `Meta.fields` but are inherited by the new detail subclass below.
- Add `CharacterItemDetailSerializer(CharacterItemSerializer)`, whose `Meta` extends the
  parent's `fields` with `['description']`.
- Add `CharacterItemDetailAllSerializer(HiddenFieldMixin, CharacterItemDetailSerializer)`,
  whose `Meta` extends `CharacterItemDetailSerializer.Meta.fields` with `['hidden']`.
- `CharacterItemAllSerializer` itself needs no field changes, for the same reason as
  `GameItemAllListSerializer` above.

Export `CharacterItemDetailSerializer` and `CharacterItemDetailAllSerializer` from
`backend/games/serializers/__init__.py` alongside the existing `CharacterItemAllSerializer`/
`CharacterItemSerializer` entries.

### Step 3 — Rewire the `GameItem` detail views

- `backend/games/views/games/game_item_detail.py`: import and use
  `GameItemDetailSerializer` instead of `GameItemListSerializer`.
- `backend/games/views/games/game_item_detail_all.py`: import and use
  `GameItemDetailAllSerializer` instead of `GameItemAllListSerializer`.
- `backend/games/views/games/game_items.py` and `game_items_all.py` (the index/index-all
  views) are unchanged — they keep using `GameItemListSerializer`/`GameItemAllListSerializer`,
  which are now lean.

### Step 4 — Rewire the `CharacterItem` detail views (PC + NPC)

- `backend/games/views/game/_character_shared.py`: change
  `build_item_detail_view`'s default parameter from
  `serializer_class=CharacterItemSerializer` to `serializer_class=CharacterItemDetailSerializer`.
  This is the single change needed for the plain item-detail endpoints on both PCs and NPCs,
  since `backend/games/views/game/pcs/detail/items/game_pc_item_detail.py` and
  `backend/games/views/game/npcs/detail/items/game_npc_item_detail.py` both call
  `build_item_detail_view(npc=...)` without overriding `serializer_class`.
- `backend/games/views/game/_items.py`: change `character_item_detail`'s default parameter
  from `serializer_class=CharacterItemSerializer` to `serializer_class=CharacterItemDetailSerializer`
  too, for consistency (it's always called with an explicit `serializer_class` from
  `_character_shared.py` today, but keeping the default in sync avoids a latent trap).
  Leave `character_items`' default as `CharacterItemSerializer` — the plain items index
  legitimately wants the lean serializer.
- `backend/games/views/game/pcs/detail/items/game_pc_item_detail_all.py`: change
  `serializer_class=CharacterItemAllSerializer` to `serializer_class=CharacterItemDetailAllSerializer`
  in the `build_item_detail_all_view(...)` call.
- `backend/games/views/game/npcs/detail/items/game_npc_item_detail_all.py`: same change as
  above, for the NPC variant.
- `game_pc_items.py`, `game_npc_items.py` (plain index), and `game_pc_items_all.py`,
  `game_npc_items_all.py` (index-all) are unchanged — they keep passing/defaulting to
  `CharacterItemSerializer`/`CharacterItemAllSerializer`, which are now lean.

### Step 5 — Update/add tests

- `backend/games/tests/serializers/games/items/game_item_list_test.py`: update expectations
  so `GameItemListSerializer`/`GameItemAllListSerializer` output no longer includes
  `description`; add a new test file (e.g. `game_item_detail_test.py` in the same folder) for
  `GameItemDetailSerializer`/`GameItemDetailAllSerializer` asserting `description` is present.
- `backend/games/tests/serializers/characters/character_item_test.py` and
  `character_item_all_test.py`: same adjustment — drop `description` from the existing
  serializer's expected output; add a new test file for
  `CharacterItemDetailSerializer`/`CharacterItemDetailAllSerializer` asserting `description`
  is present.
- `backend/games/tests/views/games/game_items_test.py` /
  `game_items_all_test.py`: assert `description` is no longer in the response payload.
- `backend/games/tests/views/games/game_item_detail_test.py` /
  `game_item_detail_all_test.py`: assert `description` is still present.
- `backend/games/tests/views/game/pcs/detail/items/game_pc_items_test.py` /
  `game_pc_items_all_test.py` and the NPC equivalents
  (`backend/games/tests/views/game/npcs/detail/items/game_npc_items_test.py` /
  `game_npc_items_all_test.py`): assert `description` is no longer in the response payload.
- `backend/games/tests/views/game/pcs/detail/items/game_pc_item_detail_test.py` /
  `game_pc_item_detail_all_test.py` and the NPC equivalents
  (`game_npc_item_detail_test.py` / `game_npc_item_detail_all_test.py`): assert `description`
  is still present.

## Files to Change

- `backend/games/serializers/games/items/game_item_list.py` — trim `GameItemListSerializer`,
  add `GameItemDetailSerializer` and `GameItemDetailAllSerializer`.
- `backend/games/serializers/characters/character_item.py` — trim `CharacterItemSerializer`,
  add `CharacterItemDetailSerializer` and `CharacterItemDetailAllSerializer`.
- `backend/games/serializers/__init__.py` — export the two new serializer classes.
- `backend/games/views/games/game_item_detail.py` — use `GameItemDetailSerializer`.
- `backend/games/views/games/game_item_detail_all.py` — use `GameItemDetailAllSerializer`.
- `backend/games/views/game/_character_shared.py` — default
  `build_item_detail_view`'s `serializer_class` to `CharacterItemDetailSerializer`.
- `backend/games/views/game/_items.py` — default `character_item_detail`'s
  `serializer_class` to `CharacterItemDetailSerializer`.
- `backend/games/views/game/pcs/detail/items/game_pc_item_detail_all.py` — use
  `CharacterItemDetailAllSerializer`.
- `backend/games/views/game/npcs/detail/items/game_npc_item_detail_all.py` — use
  `CharacterItemDetailAllSerializer`.
- Test files listed in Step 5 above (existing files updated, new detail-serializer test
  files added).

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/game/ --cov` (CI job: `pytest_views_characters`)
- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/ --ignore=games/tests/views/game/ --cov` (CI job: `pytest_views_rest`)
- `backend`: `docker-compose run --rm majora_tests pytest --ignore=games/tests/views/ --cov` (CI job: `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests poetry run ruff check .` (CI job: `checks`)

## Notes

- No frontend changes: `ItemPreviewCardHelper.jsx`/`ItemCardHelper.jsx` (card/preview
  rendering) never read `description`, and `ItemDetailHelper.jsx` (detail page rendering)
  hits the detail endpoints, which keep returning `description` unchanged.
- No migration needed — this is a serializer/view-only change, no model fields change.
- Treasure, Game, and Character (PC/NPC) serializers are intentionally out of scope per the
  discussion on issue #728 — they were confirmed already minimal.
- The issue's original "Affected endpoints" list contained several garbled/incorrect route
  paths (e.g. a PC `treasures/all.json` route that doesn't actually exist — only NPCs have
  it); the corrected, verified route list lives in the issue file itself.
