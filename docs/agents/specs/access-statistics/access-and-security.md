# Access and security

> **Status:** decided · **Source:** #1477 (Permissions, Performance & security) · Back to the
> [hub](../access-statistics.md)

Who can reach the statistics page and its endpoints, what they see, and how input and
client IPs are protected. This page transcribes decisions **settled in #1477**; it makes
none of its own.

## This page is a draft

The authoritative per-endpoint rules will live in
`docs/agents/access-control/staff-statistics.md` (in the shape of
[`staff-cache.md`](../../access-control/staff-cache.md)), created by the
shared-infrastructure implementation (see #1482) and linked from
[`access-control.md`](../../access-control.md). #1490 checks that page and this one agree
before deleting the spec.

Model-level access for `statistics.Session` and `statistics.Visit` (no API endpoints, writes
only from `StatisticsSessionMiddleware`, readable only through the Django admin) is
documented in `docs/agents/access-control/statistics.md`, created by #1478.

## Backend

- Every statistics endpoint is **GET-only** and lives under `staff/statistics/...json` in
  `backend/staff/urls.py`.
- Endpoints follow the existing staff-endpoint pattern of
  `backend/staff/views/staff_cache_summary.py`:
  - `@restricted`, which sets `X-Skip-Cache`;
  - `@api_view(['GET'])` with `AllowAny`;
  - an inline `require_staff(request)` check (`games/views/common.py`).

  Anonymous callers get **401**, non-staff callers get **403**.
- They are **not** added to the Navi cache warmer, since restricted endpoints are never
  warmed.

## Frontend

- Every tab route is gated with `[{ kind: 'staffOrSuperuser' }]` in
  `frontend/assets/js/utils/access/accessRouteConfig.js`, like `staffDashboard`.
- The "Access statistics" menu entry is shown only to staff and superusers, like the other
  staff entries.
- RequestStore gets a `staffStatistics` resource config with `permission: null` and
  identical `regular` / `private` variants, and **no** entry in
  `RequestPermissionResolvers.js`. This follows the `staffUser` precedent (#842) documented
  in that file: there is no restricted/full split to resolve, and the route-level
  `ensureStaffOrSuperUser` gate handles access control.

## Data visibility

**All staff see everything:** user identities, and raw IPs where a tab exposes them. This is
consistent with staff already seeing user details in `/staff/users`. There is no masking and
no superuser-only tier.

## Input validation

Every endpoint validates its input strictly and returns **400** on anything invalid:

- ISO dates, with `from <= to` and within the range cap;
- `tz` checked against `zoneinfo.available_timezones()`;
- `granularity` and `audience` restricted to their enums;
- `user` and `domain` as integers;
- page size capped.

Queries go through the **ORM only**: no raw SQL interpolating time zones or filters. Filter
payloads are not logged.

## Client IP integrity

Stored IPs come from `X-Forwarded-For`, which the proxy's `SetClientIpMiddleware` (a Tent
extension) unconditionally replaces with Tent's own `REMOTE_ADDR`. Stored IPs are therefore
single values and can't be spoofed by the client.

The **production topology** still needs checking (owned by #1482): nothing in front of Tent
(CDN, load balancer) may replace `REMOTE_ADDR`, and the backend port must not be directly
reachable.

## Reviews

The `security` and `data-access` agents review every implementation sub-issue that adds
endpoints.
