# Scope catalogue constant

Add the single source of truth for scopes in `backend/accounts/`. It defines the 16 families from
the spec (`games`, `players`, `pcs`, `npcs`, `documents`, `factions`, `items`, `common_items`,
`possessions`, `recipes`, `treasures`, `sessions`, `polls`, `tasks`, `conversations`,
`miniatures`), the two actions (`read`, `write`), and the derived 32 `<family>:<action>` strings,
in a stable, ordered collection (#1604's `options.json` will serve it as-is). Also expose a
`METHOD_ACTIONS` map (`GET` → `read`; `POST`/`PUT`/`PATCH`/`DELETE` → `write`) for documentation
and tests, and a helper that returns a token's effective scopes, meaning stored scopes
intersected with the catalogue, so that dropped scopes grant nothing.

Tests: the catalogue has exactly 32 unique entries; unknown stored scopes are filtered out.

## Files to Change
- `backend/accounts/scopes.py` — new: families, actions, `SCOPES`, `METHOD_ACTIONS`, `effective_scopes(api_token)`.
- `backend/accounts/tests/scopes_test.py` — new: catalogue and helper tests.
