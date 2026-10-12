# Backend Plan: Game content copy: Possessions tab

Main plan: [plan.md](plan.md)

## Shared contracts

Produce `GET /staff/copies/possessions.json` with rows `{id, name, hidden, photo, copied_to_target}`:
- `photo` is the ready cover path, or `null`;
- the list includes hidden possessions, is ordered by `id` and is paginated;
- `copied_from` is never exposed.

Produce `POST /staff/copies/possessions/<id>.json` `{target}` → `201 {id, links}`, with 0 or 1 cover link. Register `possessions` **last** in `COPY_TYPES`.

## Steps

- [01 — Possessions copy type, serializer and cache paths](backend/01-possessions-copy-type.md)
- [02 — Cover link finalize cache paths](backend/02-cover-link-cache-paths.md)
- [03 — Tests](backend/03-tests.md)

## CI Checks
- `backend`: pytest and the linters, run in the test container (`make tests`, then the project's pytest/flake8/pylint commands as documented in `docs/agents/`).

## Notes
- Mirror `ItemsCopyType` / `items_copy_cache_paths` closely. The only differences are the slug, the model, the photo owner field (`game_possession`), the path segment (`possessions`) and the available-list family (`possessions`).
- `GamePossession.copied_from` already exists (`games/migrations/0105_copied_from.py`), so no migration is needed.
- The pending-links query already reaches `GamePossessionPhoto` through `game_possession__game` via the existing `CoverCopyLink(GamePossessionPhoto, 'game_possession')` entry. Tests confirm it; no code change.
- `_set_possession_photo` in `backend/uploads/views.py` must **not** run for copy-origin uploads. The `CopyLinkFinalizer` path already bypasses it; a test confirms it.
