# Items copy type and cache hook
Wire Items on top of steps 01–03, following `docs/agents/specs/game-content-copy/items.md`.

- **Cache paths for the target**: `items_copy_cache_paths(item)` =
  `GameResourceCachePaths('items', **FULL_FAMILY).paths(item)` (reuse the `game_item` photo
  type's builder from `photo_types.py` rather than a new instance where possible) + the step-03
  builder for `items` on `item.game`.
- **`ItemsCopyType`** (`slug='items'`, model `GameItem`):
  - list serializer: `id`, `name`, `hidden`, `photo` (the cover's `path` when `photo.ready`,
    else `None`; `select_related('photo')` to avoid N+1), `copied_to_target`;
  - `copied_fields = ('name', 'description', 'hidden')`; `photo` stays null on the copy;
  - associated-rows hook: the step-02 builder on `source.photo` only (any other `GameItemPhoto`
    row of the source is ignored), segments `['games', target.game_slug, 'items', copy.id]`;
  - `cache_paths` = `items_copy_cache_paths(copy)`.
- **Registry**: `COPY_TYPES = (ItemsCopyType(),)` — insert it **first**, keeping the module
  docstring's ordering rule.
- **Copy-link hook**: in `copy_links.COPY_LINKS`, pass
  `cache_paths=lambda row, upload: items_copy_cache_paths(row.game_item)` to
  `CoverCopyLink(GameItemPhoto, 'game_item')`. Watch for import cycles between `copy_links`,
  `copy_types` and `photo_types` (put the shared function in a module both can import).

Tests (spec "Testing"): copied `name`/`description`/`hidden`/`copied_from`, `game` = target,
`photo` null at copy time; one `is_cover` link for a ready cover at
`photos/games/<target>/items/<copy-id>/photo<ext>`; no link for no photo / not-ready cover;
non-cover `GameItemPhoto` ignored; `CharacterItem` rows not copied; name clash allowed (`201`);
whole copy rolled back on failure; list row fields (`photo` only when ready), hidden items listed,
order by id, `copied_to_target` true/false; `GET staff/copies.json` lists `items`; finalize of the
copied cover sets the copy's `photo` and returns the same `X-Cache-Clear`; pending-links list shows
the item link; `X-Cache-Clear` = item family + one `items/available.json` per target PC/NPC, and
only the family when the target has no characters.

## Files to Change
- `backend/staff/copy_types.py` — register the items entry first; update the docstring if it still says the registry ships empty.
- `backend/staff/copy_types_items.py` (new, or `backend/staff/copy_types/items.py` if the module becomes a package) — `ItemsCopyType`.
- `backend/staff/serializers/staff_copy_item.py` (new) — list row serializer; export it.
- `backend/staff/copy_links.py` — `cache_paths` hook on the `GameItemPhoto` entry.
- `backend/staff/tests/copy_types_test.py` — replace `test_registry_is_empty` with the `items`-first assertion.
- `backend/staff/tests/staff_copies_items_test.py` (new) — list/copy endpoint tests.
- `backend/staff/tests/copy_links_test.py`, `backend/uploads/tests/views_finalize_copy_test.py` — items cache-paths hook and finalize header.
- `backend/staff/tests/staff_copies_index_test.py`, `staff_copy_links_test.py` — adjust any assertion relying on the empty registry.
