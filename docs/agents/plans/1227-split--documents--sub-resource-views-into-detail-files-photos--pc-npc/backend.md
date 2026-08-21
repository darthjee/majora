# Backend Plan: Split 'documents' sub-resource views into detail/files/photos (PC/NPC)

Main plan: [plan.md](plan.md)

## Steps

- [01 — Split NPC documents views into detail/files/photos](backend/01-split-npc-documents-views.md)
- [02 — Split PC documents views into detail/files/photos](backend/02-split-pc-documents-views.md)
- [03 — Update npcs/pcs __init__.py re-export paths](backend/03-update-init-exports.md)
- [04 — Run backend test suite and verify](backend/04-verify-tests.md)

## CI Checks

- `backend/games/views/game/{npcs,pcs}/detail/documents/`: `poetry run pytest games/tests/views/game/` (CI job: `pytest_views_characters`)
- `backend/`: `poetry run pytest --ignore=games/tests/views/` (CI job: `pytest_all`) — sanity check that the `__init__.py` changes don't break anything outside the `views/` tree.

## Notes

- Pure structural move — no behavior, serializer, or permission changes. `_document_shared.py` (the factory module every moved file wraps) does not move and does not change.
- Each moved file gains exactly one `..` level in its relative import to `_document_shared.py` (4 levels up → 5), since it moves one directory deeper (`documents/` → `documents/{detail,files,photos}/`).
- New subfolder `__init__.py` files are a single one-line module docstring only, no re-exports — matches the established convention in sibling folders (`npcs/detail/items/__init__.py`, `npcs/detail/possessions/__init__.py`, `npcs/detail/photos/__init__.py`), verified during discussion of the issue.
- No URLconf changes: `urls.py` only imports from the `npcs`/`pcs` package `__init__.py`, never from individual view submodules.
