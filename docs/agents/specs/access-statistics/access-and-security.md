# Access and security

> **Status:** decided · **Source:** #1477 (Permissions, Performance & security) · Back to the
> [hub](../access-statistics.md)

Who can reach the statistics page and its endpoints, what they see, and how input and
client IPs are protected. This page transcribes decisions **settled in #1477**; it makes
none of its own.

## This page is a draft

The authoritative per-endpoint rules live in
[`access-control/staff-statistics.md`](../../access-control/staff-statistics.md) (in the shape
of [`staff-cache.md`](../../access-control/staff-cache.md)), created by #1482, kept in sync by
the implementation sub-issues, and linked from
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

Django is a public Render web service: Tent reaches it over the internet, and any client
can also call it directly. Client-IP trust therefore comes from a shared-secret gate, not
from Django being unreachable (#1501).

- **Secret gate.** Tent wires `SetClientIpMiddleware` and sends `X-Proxy-Secret` on the
  standard proxy rules to Django (`backend.php`, `private_game_data_cache.php`, `admin.php`,
  `redirects.php`, prod and dev), and strips any client-supplied copy first. Both sides read
  the same `PROXY_SECRET` env var; an empty value means disabled. Django
  ([`common/client_ip.py`](../../../../backend/common/client_ip.py)) trusts
  `X-Forwarded-For` only when the header matches `PROXY_SECRET`, compared in constant time
  as bytes ([`common/secret_compare.py`](../../../../backend/common/secret_compare.py)), so a
  non-ASCII header is a plain mismatch, never an error.
- **Exception: custom-handler rules.** `cache.php`, `delete.php` and `uploads.php` reach
  Django through custom handlers built on `BackendClient`, whose forwarded-header allow-list
  drops both `X-Forwarded-For` and `X-Proxy-Secret`. Django therefore records `REMOTE_ADDR`
  (Tent's IP) for those requests. This is fail-safe: the IP is not client-chosen, only less
  precise.
- **Leftmost entry.** Tent's `SetClientIpMiddleware` replaces `X-Forwarded-For` with exactly
  one value, its own `REMOTE_ADDR`; later hops (Render) may append entries. Django splits on
  `,`, strips the leftmost entry and validates it with `ipaddress.ip_address`.
- **`REMOTE_ADDR` fallback.** A missing or wrong secret, a disabled gate, or an invalid
  leftmost entry all fall back to `REMOTE_ADDR`. Requests are **never rejected**, so health
  checks and other direct callers keep working; their forged header is ignored. Direct
  callers usually share Render's proxy IP, which is acceptable since the value is no longer
  client-chosen.
- `StatisticsSessionMiddleware` stores the resolved value, so `Session.ip` is always a
  single valid IP (or `null`).

**Caveat: edge proxy in front of Tent (not yet verified).** The fix assumes clients connect
straight to Tent. If a CDN/edge sits in front of Tent, Tent's `REMOTE_ADDR` is the edge's IP
and every request is recorded with it. Restoring the real IP from the edge's header (trusted
only from the edge's ranges) would be a follow-up issue.

### `PROXY_SECRET` configuration

The same random value must be set on both sides; an empty value disables the gate.

| Where | How |
|---|---|
| Django, production | `PROXY_SECRET` env var on the Render backend service (set manually in the Render dashboard). |
| Tent, production | `$proxySecret` in the server-side `locals.php`, copied at deploy time and not stored in the repo (documented in `proxy/prod_configuration/locals.php.sample`). |
| Local dev | `PROXY_SECRET` in `.env` (see `.env.dev.sample`); Django reads it directly, and `majora_proxy` reads it with `getenv` in `proxy/dev_configuration/locals.php`. |

**Rollout.** Until `PROXY_SECRET` is set on both Tent and Django, every request falls back
to `REMOTE_ADDR` and statistics lose real client IPs. Deploy with both values configured.

### Post-deploy check (manual, owner)

1. Through Tent, send a request with a forged `X-Forwarded-For`; the stored session IP must
   be the real client IP.
2. Directly to the Render backend host, send a forged `X-Forwarded-For`; the stored IP must
   be the connecting peer (`REMOTE_ADDR`), not the forged value.
3. Compare Tent's `REMOTE_ADDR` with the real client IP. If they differ, an edge proxy sits
   in front of Tent; open the follow-up described in the caveat above.

See also [shared infrastructure](shared-infrastructure.md#production-topology-check).

## Reviews

The `security` and `data-access` agents review every implementation sub-issue that adds
endpoints.
