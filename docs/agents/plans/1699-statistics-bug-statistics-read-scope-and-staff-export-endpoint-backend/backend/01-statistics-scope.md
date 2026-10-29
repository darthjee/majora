# Read-only statistics scope

Make the scope catalogue support per-family actions and add the `statistics` family with the
`read` action only. Keep every existing family at `(read, write)` so `SCOPES` is otherwise
unchanged, and keep `SCOPES` the single source of truth for the decorator, the authentication
check, token creation and the options endpoint. Also expose the set of staff-only scopes
(`STAFF_ONLY_SCOPES = frozenset({'statistics:read'})` or equivalent) for the next step.

Tests: `statistics:read` is in `SCOPES`, `statistics:write` is not, existing scopes are unchanged,
and `effective_scopes` keeps `statistics:read`.

## Files to Change

- `backend/accounts/scopes.py` — per-family actions, `statistics` family, staff-only scope set.
- `backend/accounts/tests/scopes_test.py` — catalogue tests.
