# Update the docs

- `docs/agents/access-control/api-token.md` — the scoped device flow: requesting scopes on
  create, the staff-only check on approval, the 24-hour token issued on poll, no legacy token or
  session.
- `docs/agents/access-control/token-scopes.md` — how scopes can also be granted through device
  authorization.
- `docs/agents/specs/statistics-bug/export-endpoint.md` — mark the Device authorization section
  as implemented by #1708 (the status note at the top).
- Any device-authorization doc under `docs/agents/` that describes the poll response (search for
  `authorization_requests`) — mention the optional `scopes` and the scoped token.

## Files to Change

- `docs/agents/access-control/api-token.md`
- `docs/agents/access-control/token-scopes.md`
- `docs/agents/specs/statistics-bug/export-endpoint.md`
