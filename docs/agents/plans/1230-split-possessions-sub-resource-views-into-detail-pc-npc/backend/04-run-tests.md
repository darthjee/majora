# Run the full backend test suite

Confirm the move is behavior-neutral: run the full backend suite, and at minimum the games
views suite that covers these folders, and fix any import errors (e.g. a missed dot-count
bump) or collection errors before considering this issue done.

```bash
cd backend
poetry run pytest games/tests/views/game/ --cov --cov-report=lcov:coverage/lcov.info
poetry run pytest
```

## Files to Change

None — verification only.
