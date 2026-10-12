# Tests

Cover the per-type cases of `possessions.md` "Testing". Use `staff_copies_items_test.py` / `staff_copies_common_items_test.py` as the template, with `GamePossessionFactory` and `CharacterPossessionFactory`.

- `backend/staff/tests/staff_copies_possessions_test.py` (new):
  - **list**:
    - row fields;
    - every possession listed, hidden included, ordered by id;
    - `photo` only when the cover is ready, `null` when not ready;
    - `copied_to_target`;
    - pagination;
    - query count does not grow with rows.
  - **copy**:
    - `name`, `description`, `hidden` and `copied_from` copied, and `game` set to the target;
    - `photo` null at copy time;
    - one `is_cover=true` link for a ready cover, at `photos/games/<target>/possessions/<copy-id>/photo<ext>` keeping the source extension, with the copy photo row `ready=false`;
    - no link for no photo or a not-ready cover;
    - a non-cover `GamePossessionPhoto` is ignored;
    - `CharacterPossession` rows not copied;
    - name clash allowed;
    - superuser can copy;
    - rollback on failure;
    - unknown source returns 404.
  - **cache**: `X-Cache-Clear` holds only the family when the target has no characters, and the family plus one `pcs/<id>/possessions/available.json` per PC and one `npcs/<id>/possessions/available.json` per NPC otherwise.
  - **links**: the pending-links list shows the cover link, reaching the game through `game_possession__game`. The finalize sets the copy's `photo` and sends the same `X-Cache-Clear`.
- `backend/staff/tests/copy_types_test.py` — `possessions` registered as the last type, and `PossessionsCopyType` unit cases (segments, copied fields).
- `backend/staff/tests/copy_links_test.py` — the `GamePossessionPhoto` hook returns `possessions_copy_cache_paths`.
- `backend/staff/tests/staff_copies_index_test.py` — `types` ends with `possessions`.
- `backend/uploads/tests/views_finalize_copy_test.py` — a possession cover finalize sets the photo and sends the family plus the per-character `available.json` paths.

## Files to Change
- `backend/staff/tests/staff_copies_possessions_test.py` — new.
- `backend/staff/tests/copy_types_test.py` — registry order and type cases.
- `backend/staff/tests/copy_links_test.py` — possession hook.
- `backend/staff/tests/staff_copies_index_test.py` — types order.
- `backend/uploads/tests/views_finalize_copy_test.py` — possession cover finalize.
