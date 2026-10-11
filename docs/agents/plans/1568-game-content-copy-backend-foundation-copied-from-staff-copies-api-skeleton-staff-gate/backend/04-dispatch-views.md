# Add the list and copy dispatch views
Two generic views in `backend/staff/views/`, with the `staff_photos_list` decorator stack and `require_staff` first. Shared lookups go in `backend/staff/views/_staff_copy_shared.py` (like `_staff_photo_shared.py`).

**`staff_copies_list.py`** — `GET staff/copies/<str:copy_type>.json?from=&to=`
1. `require_staff` → `401`/`403`.
2. `copy_types.find(copy_type)` → `404` if None.
3. `from`/`to`: each must be present and match a `Game.game_slug`, and the two must differ. Otherwise `400` with `{'errors': {<param>: [<code>]}}`, following the `_error_codes` style (`required`, `not_found`, `same_game`).
4. `return entry.list(request, from_game, to_game)`.

**`staff_copy_create.py`** — `POST staff/copies/<str:copy_type>/<int:source_id>.json` `{target}`
1. `require_staff` → `401`/`403`.
2. `copy_types.find(copy_type)` → `404`.
3. `target` from `request.data`: it must be a non-empty string matching a `Game.game_slug`, else `400` (`{'errors': {'target': [...]}}`). Malformed JSON is already `400` through DRF's `ParseError`, inside `@restricted`. A non-dict body (for example a JSON list) is `400` too.
4. `entry.find_source(source_id)` → `404` if None.
5. `target_game == source.game` → `400` (`{'errors': {'target': ['same_game']}}`).
6. `return entry.copy(request, source, target_game)`.

URLs in `backend/staff/urls.py`, after `staff/copies/games.json`: `staff/copies/<str:copy_type>.json` (`staff-copies-list`) and `staff/copies/<str:copy_type>/<int:source_id>.json` (`staff-copy-create`).

Tests: `staff_copies_list_test.py` and `staff_copy_create_test.py`, using the fake type from step 02:
- `401`/`403` with an unknown type and with a registered type; `X-Skip-Cache: true` on every status (`200`, `400`, `401`, `403`, `404`, `405`).
- Unknown type → `404` (both views, real empty registry).
- List: `from`/`to` missing, unknown, or equal → `400`; valid → the fake type receives the two resolved games and its response is returned.
- Copy: `target` missing, empty, not a string, unknown, or malformed JSON → `400`, including when `<id>` doesn't exist (validation order); unknown `<id>` with a valid target → `404`; target equal to the source's game → `400`; valid → the fake type receives the source row and target game. A GET on the copy URL is `405`.

## Files to Change
- `backend/staff/views/_staff_copy_shared.py` — new: game-slug resolution and `400` helpers.
- `backend/staff/views/staff_copies_list.py`, `staff_copy_create.py` — new.
- `backend/staff/views/__init__.py` — export both.
- `backend/staff/urls.py` — two routes, after `games.json`.
- `backend/staff/tests/staff_copies_list_test.py`, `staff_copy_create_test.py` — new.
