# Update the token-scopes doc

In `docs/agents/access-control/token-scopes.md`:
- **Status paragraph**: add a sentence saying the miniatures family (`miniatures/sources…`, `miniatures/stl_models…` and `miniatures/collections…`, with their imports and photo upload inits) is declared (#1638). Drop #1638 from the "add the remaining declarations" list. If the pending list was deleted in step 01, rewrite the paragraph's tail to say every view is now declared.
- **Read scopes**: add a bullet saying miniatures reads are login-only, so they are restricted and need `miniatures:read`. That covers the list and detail routes for sources, STL models and collections.
- **Write scopes**: add a bullet saying every miniatures write (create, STL model `PATCH`, imports, photo upload inits) needs `miniatures:write` alone. The views keep `require_staff`, so a non-staff owner holding the scope still gets `403`.

## Files to Change
- `docs/agents/access-control/token-scopes.md` — status paragraph and read/write bullets for the miniatures family
