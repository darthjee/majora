# Step 2: apply the marker

Save the collection first:

```bash
docker-compose run --rm majora_tests sh -c 'poetry run pytest --collect-only -q' > /tmp/collect-before.txt
```

(Save it on the host side of the redirect, outside the repo, or in the scratchpad.)

## Mark (method or class, the smallest scope that covers every history read)

- `versioning/tests/historical_records_test.py`: every class (the whole module is about history).
- `accounts/tests/models/password_reset_token_history_test.py`: the class(es) reading `.history`.
- `games/tests/models/game/game_recipe_test.py`: `test_history_is_tracked`.
- `games/tests/views/game/pcs/detail/recipes/detail/game_pc_recipe_detail_patch_test.py`: `test_records_history`.
- `games/tests/views/game/npcs/detail/recipes/detail/game_npc_recipe_detail_patch_test.py`: `test_records_history`.
- `games/tests/models/copied_from_test.py`: `test_nulling_creates_no_history_entry_on_copy`
  (asserts no new entry; it would pass vacuously with history off).

Then sweep for anything else reading `simple_history` rows:

```bash
grep -rnE '\.history\b|history_(user|type|date|id)|Historical[A-Z]' backend --include='*_test.py'
```

Mark any additional hit that reads rows. Ignore `page_history` / `GameDocumentPageHistory` (custom model).

## Do not mark

`common/tests/history_test.py`, `accounts/tests/models/authorization_request_test.py` (only
`_meta`), `staff/tests/staff_copies_documents_test.py`,
`games/tests/models/game/game_document_page_history_test.py`,
`games/tests/views/games/game_document_pages_all_test.py`,
`game_document_pages_bump_version_test.py`, `game_document_page_detail_test.py`.

## Run

Run the full suite. If an unmarked test fails because it relies on history rows, mark it (and
list it in the PR) rather than changing its assertions.
