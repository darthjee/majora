# Tests

Cover the spec's backend "Testing" cases, following `staff_copies_items_test.py`,
`copy_types_test.py`, `copy_links_test.py` and `views_finalize_copy_test.py`:

- copy: `name`/`price`/`description`/`category`/`hidden`/`copied_from` copied, `game` set to the
  target, `photo` null at copy time; `GameRecipe` rows not copied; name clash in the target
  allowed (`201`, never `422`);
- cover link: one link with `is_cover=true` for a ready cover, at
  `photos/games/<target-slug>/common_items/<copy-id>/photo<ext>` keeping the source extension;
  no link for no photo or a not-ready cover; a non-cover `GameCommonItemPhoto` is ignored;
- list: row fields (`category` raw value, `price`, `photo` only when ready, `copied_to_target`),
  hidden common items listed, ordered by id, paginated;
- finalize sets the copy's `photo` FK; `X-Cache-Clear` paths on the copy `201` and on the
  finalize; pending-links query reaching the game through `game_common_item__game`;
- registry: `GET staff/copies.json` lists `common_items` right after `items` (update the index
  and list tests that assert the type order);
- `copy_instance` returns `(copy, uploads)` without a Response.

## Files to Change
- `backend/staff/tests/staff_copies_common_items_test.py` — new endpoint tests.
- `backend/staff/tests/copy_types_test.py` — `CommonItemsCopyType` and `copy_instance` units.
- `backend/staff/tests/copy_links_test.py` — `GameCommonItemPhoto` cache paths.
- `backend/staff/tests/copy_test_support.py` — common item factories/helpers if needed.
- `backend/staff/tests/staff_copies_index_test.py`, `staff_copies_list_test.py` — type order.
- `backend/uploads/tests/views_finalize_copy_test.py` — common item finalize sets `photo` and clears the paths.
