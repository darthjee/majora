# Access and security foundation page

Write `docs/agents/specs/access-statistics/access-and-security.md` in full, as prose with a
`Status: decided` line. Content, from #1477's Permissions and Performance & security
sections:

- **Backend:**
  - staff-or-superuser, **GET-only** endpoints under `staff/statistics/...json` in
    `backend/staff/urls.py`;
  - following `backend/staff/views/staff_cache_summary.py`: `@restricted` (sets
    `X-Skip-Cache`), `@api_view(['GET'])` + `AllowAny`, and an inline `require_staff(request)`
    (`games/views/common.py`), so anonymous callers get 401 and non-staff get 403;
  - not added to the Navi cache warmer.
- **Frontend:**
  - `[{ kind: 'staffOrSuperuser' }]` route gates in
    `frontend/assets/js/utils/access/accessRouteConfig.js`;
  - the menu entry is visible only to staff/superusers;
  - a `staffStatistics` RequestStore config with `permission: null` and identical
    `regular`/`private` variants, and **no** `RequestPermissionResolvers.js` entry, per the
    `staffUser` (#842) precedent documented in that file.
- **Data visibility:** all staff see everything, including IPs and user identities.
- **Input validation**, returning 400 on anything invalid:
  - ISO dates, with `from <= to` and the range cap;
  - `tz` checked against `zoneinfo.available_timezones()`;
  - `granularity` and `audience` enums;
  - integer `user` / `domain`;
  - a capped page size.

  ORM only, with no raw SQL interpolating zones or filters.
- **IP integrity:** the proxy's `SetClientIpMiddleware` (Tent extension) replaces any
  client-sent `X-Forwarded-For` with Tent's `REMOTE_ADDR`, so stored IPs are single values and
  can't be spoofed. The production topology still needs checking (owned by #1482).
- **This page is a draft.** The authoritative per-endpoint doc will be
  `docs/agents/access-control/staff-statistics.md` (shape of `staff-cache.md`), created by the
  shared-infrastructure implementation. Model-level access for `Session`/`Visit` is in
  `docs/agents/access-control/statistics.md` (created by #1478). Link both, noting that they
  may not exist yet.
- The `security` and `data-access` agents review every implementation sub-issue that adds
  endpoints.

## Files to Change

- `docs/agents/specs/access-statistics/access-and-security.md`: new foundation page.
