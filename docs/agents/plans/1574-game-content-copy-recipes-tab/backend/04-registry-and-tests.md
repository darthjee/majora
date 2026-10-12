# Registry and tests

Register `RecipesCopyType()` in `COPY_TYPES` right after `CommonItemsCopyType()`, and update the
existing order assertions.

Add `backend/staff/tests/staff_copies_recipes_test.py`, mirroring
`staff_copies_common_items_test.py` (use `StaffCopyActorsMixin`, `GameRecipeFactory`,
`GameCommonItemFactory`), covering the spec's "Testing" cases:

- copied fields + `hidden` + `copied_from`, `game` = target;
- reuse of an existing direct common item copy: no new common item, empty `links`, reused one
  unchanged; highest `id` chosen among several; `copied_from` chain not walked (B1→A case);
- common item copied in the same transaction when none exists: fields, `hidden`, `copied_from`,
  cover link `is_cover=true`; no link for no photo / not-ready cover;
- rollback of both rows on failure (e.g. patch the recipe create to raise);
- `CharacterRecipe` rows not copied; name clash allowed;
- sequential copies of two recipes sharing a common item → one shared copy;
- list: row fields incl. nested `common_item` and both `copied_to_target`s, hidden listed,
  pagination/order;
- `X-Cache-Clear` paths for the reuse and the copy cases;
- staff gate / 404 / bad target follow the global behavior (covered generically; add one smoke case).

## Files to Change
- `backend/staff/copy_types.py` — register `recipes` after `common_items`.
- `backend/staff/tests/copy_types_test.py` — registry order + `find('recipes')`.
- `backend/staff/tests/staff_copies_index_test.py` — `types[:3]`.
- `backend/staff/tests/staff_copies_recipes_test.py` — new.
