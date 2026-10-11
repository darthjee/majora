# Add the index and games views
Two new views in `backend/staff/views/`, exported from `staff/views/__init__.py`. Both use the `staff_photos_index` decorator stack, with `require_staff` first.

- `staff_copies_index.py` — `GET staff/copies.json` returns `{'types': copy_types.slugs()}` (`{'types': []}` for now).
- `staff_copies_games.py` — `GET staff/copies/games.json` returns every `Game`, ordered by `name` and not paginated, as `[{'slug': game.game_slug, 'name': game.name, 'domain_groups': [<group name>, ...]}]`. Use `prefetch_related('game_domain_groups')`; there is no domain or visibility filtering (do **not** use `DomainGamesCache`). Serialize with a small `StaffCopyGameSerializer` in `backend/staff/serializers/` (exported like the existing staff serializers). It exposes `slug`, `name` and `domain_groups` (group names only, ordered by name).

Register the URLs in `backend/staff/urls.py`: `staff/copies.json` (`staff-copies-index`) and `staff/copies/games.json` (`staff-copies-games`). Put `games.json` **before** the generic `staff/copies/<str:copy_type>.json` pattern added in step 04.

Tests: `staff_copies_index_test.py` and `staff_copies_games_test.py`, using the step 02 support:
- `401` anonymous and `403` regular user, each with `X-Skip-Cache: true`; `200` for staff and for superuser; `X-Skip-Cache: true` on `200`; `405` on POST still carries `X-Skip-Cache`.
- Index: `{'types': []}`; with the fake type registered, its slug is listed.
- Games: a game in no domain group gets `[]`; a game in two groups lists both names; a game whose group isn't the request's domain is still listed; ordering is by name.

## Files to Change
- `backend/staff/views/staff_copies_index.py` — new.
- `backend/staff/views/staff_copies_games.py` — new.
- `backend/staff/views/__init__.py` — export both.
- `backend/staff/serializers/staff_copy_game.py` (+ `serializers/__init__.py`) — new serializer.
- `backend/staff/urls.py` — two routes.
- `backend/staff/tests/staff_copies_index_test.py`, `staff_copies_games_test.py` — new.
