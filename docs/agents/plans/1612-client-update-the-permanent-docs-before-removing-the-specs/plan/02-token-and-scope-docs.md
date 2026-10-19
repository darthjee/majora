# Token and scope access-control docs

Move the spec's `tokens.md`, `scopes.md` and the long-lived parts of `token-api.md` into
`docs/agents/access-control/`, checked against `backend/accounts/` (`models/`,
`authentication.py`, `api_tokens.py`, `scopes.py`, `middleware.py`, `views/`, `serializers/`).

- **`access-control/api-token.md`**: add a "Token format and lifecycle" section (the `mjr_`
  prefix, the stored prefix and hash, the secret shown once, `Authorization: Bearer` detection
  and `ApiTokenAuthentication`, expiry, last-used tracking, auto-revoke). Add the
  reachable-game definition and the `options.json` payload from `token-api.md`, plus the
  validation and error codes (400/401/403/404/415) and the edge cases still relevant. Replace
  its three spec links with in-page anchors or links to `token-scopes.md`.
- **New `access-control/token-scopes.md`**: the scope catalogue (`read`/`write` per resource
  family) as defined in `backend/accounts/scopes.py`, intersection with the owner's roles,
  read scopes and plain routes, write scopes and link routes, the per-game restriction,
  uploads, error responses, storage and validation, the routes never reachable with a scoped
  token (`account/`, `staff/`), and enforcement: the per-view `@token_scopes` declaration,
  failing closed. Include a "how to declare scopes on a new view" note for backend work.
- **`access-control.md`**: register `token-scopes.md` next to `api-token.md`.
- **`access-control/endpoints.md`**: repoint the `specs/client/tokens.md` link (line ~146).
- **`permissions.yaml`**: token scopes narrow a user's existing access and add no role. Leave
  it unchanged unless the review finds a role/scope row that is genuinely missing. Record the
  decision in the PR description.

## Files to Change

- `docs/agents/access-control/api-token.md` — add token model, lifecycle, reachable games,
  options and error codes; drop spec links.
- `docs/agents/access-control/token-scopes.md` — new.
- `docs/agents/access-control.md` — register the new page.
- `docs/agents/access-control/endpoints.md` — repoint the spec link.
