# Backend Plan: Split 'possessions' sub-resource views into detail/ (PC/NPC)

Main plan: [plan.md](plan.md)

## Steps

- [01 — Move NPC and PC member-action view files into possessions/detail/](backend/01-move-view-files.md)
- [02 — Move mirrored test files into possessions/detail/](backend/02-move-test-files.md)
- [03 — Update npcs/__init__.py and pcs/__init__.py re-export paths](backend/03-update-init-exports.md)
- [04 — Run the full backend test suite](backend/04-run-tests.md)

## CI Checks

- `backend`: `poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info` (CI job: `pytest_views_characters`)

## Notes

- Purely structural: no logic, serializer, or permission changes anywhere in this plan.
- `_all`/`_full`/`_available` variants stay as separate files (different serializers/permissions) — only their folder location changes.
- `urls.py` is untouched — it imports from the `npcs`/`pcs` package's `__init__.py`, which keeps exporting the same names after Step 03.
