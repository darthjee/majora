# Run backend test suite and verify

Confirm the reorganization is behavior-preserving: no broken imports, no missing/renamed routes, no test collection errors from the moved files.

Run the scoped views suite first (fastest signal, covers exactly the changed trees), then the full suite to catch anything relying on `npcs`/`pcs` package-level imports elsewhere in the codebase.

## Files to Change

None — verification only.

## Notes

- `poetry run pytest games/tests/views/game/` should collect and pass every moved NPC/PC document test with the same pass/fail outcome as before the move.
- `poetry run pytest` (full suite) should show no import errors from `npcs/__init__.py` or `pcs/__init__.py`.
- If any test fails only on collection (e.g. `ModuleNotFoundError`), it almost always means an import depth was left at 4 dots instead of 5, or an `__init__.py` re-export path in step 03 wasn't updated to match the actual moved-file location.
