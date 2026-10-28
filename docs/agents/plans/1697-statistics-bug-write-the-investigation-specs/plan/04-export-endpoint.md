# Export endpoint and scope page

`export-endpoint.md` — the contract for #1699 (backend) and #1700 (frontend). Mark as *planned by
#1699 / #1700*.

- **Scope:** family `statistics` (not `sessions`, which means game sessions), action `read` only —
  no `statistics:write`; `backend/accounts/scopes.py` needs per-family actions or an equivalent.
  Staff-only (admin or staff, `AdminOrStaffCache.is_admin_or_staff`). Token creation and the
  device-authorization approval reject it for non-staff with an explicit error. Per-game token
  restrictions have no effect.
- **Access matrix** (copy from the issue's *Permissions* section): anonymous 401; invalid/revoked
  token 401 `token_invalid`; non-staff browser 403 `not_allowed`; staff browser ✅; token without
  the scope 403; token with the scope and a staff owner ✅ on the export endpoint only; every
  other staff endpoint (dashboard statistics endpoints, `DELETE staff/statistics.json`, cache,
  copy, crawler, photo) stays 403 `token_not_allowed` for any token.
- **Endpoint contract:** `GET` under `staff/statistics/…` (exact route chosen by #1699);
  params: date range (bounded by `MAJORA_STATISTICS_MAX_RANGE_DAYS`), optional domain, page;
  maximum page size; ordering on indexed columns; payload: sessions (`id`, `ip`, `domain`,
  `user_id`, `created_at`, `last_seen_at`) with visits (`started_at`, `last_seen_at`, `hits`),
  fetched in batches (no N+1). Never the session `token`, never e-mail/name/profile.
- **Caching & tracking:** `X-Skip-Cache`; listed in `docs/agents/no-private-cache-routes.md`; not
  warmed by Navi; its own requests create no statistics sessions/visits.
- **Device authorization:** the script uses the existing flow
  (`users/authorization_requests.json` create/poll, approved via
  `account/authorization_requests/<uuid>/authorize.json`).
- **Frontend (#1700):** scope offered only to staff, resolved through `RequestStore` /
  `RequestPermissionResolvers`; approval screen labels it as access to visitor statistics (IP
  addresses and visit history); translations for every language.

## Files to Change

- `docs/agents/specs/statistics-bug/export-endpoint.md` — new.
