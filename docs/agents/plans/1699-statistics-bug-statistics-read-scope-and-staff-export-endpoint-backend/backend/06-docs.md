# Documentation

- `docs/agents/access-control/token-scopes.md` — the `statistics` family (read only), staff-only
  granting, `scope_staff_only`, and the exact-route carve-out of `staff/`.
- `docs/agents/access-control/api-token.md` and `docs/agents/access-control/endpoints.md` — the new
  endpoint and who can reach it.
- `docs/agents/no-private-cache-routes.md` — add `GET /staff/statistics/export.json` (raw IPs and
  user ids).
- `docs/agents/statistics.md` — the export endpoint and the middleware exemption.
- `docs/agents/specs/statistics-bug/export-endpoint.md` — record the chosen route, visits cap and
  error code (replace "chosen by #1699").

Navi is not changed. Run `yarn lint_md` through docker-compose.

## Files to Change

- `docs/agents/access-control/token-scopes.md`
- `docs/agents/access-control/api-token.md`
- `docs/agents/access-control/endpoints.md`
- `docs/agents/no-private-cache-routes.md`
- `docs/agents/statistics.md`
- `docs/agents/specs/statistics-bug/export-endpoint.md`
