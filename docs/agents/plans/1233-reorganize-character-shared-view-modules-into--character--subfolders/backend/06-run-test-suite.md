# Run and fix the backend test suite

Run the full backend test suite and fix any remaining import errors the mechanical steps above missed.

```bash
cd backend && poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info
cd backend && poetry run pytest games/tests/ --cov --cov-report=lcov:coverage/lcov.info
```

Confirm no file under `backend/games/views/game/` still imports any of the 8 moved shared modules at their old flat location:

```bash
grep -rnE "from \.+_?(character_shared|document_shared|faction_shared|item_shared|photo_shared|possession_shared|treasure_shared|treasure_finder) import" backend/games/views/game --include="*.py" | grep -v "^backend/games/views/game/_character/"
```

An empty result confirms every reference now points into `_character/`.

## Files to Change

- Any file surfaced by the test run or the grep check above
