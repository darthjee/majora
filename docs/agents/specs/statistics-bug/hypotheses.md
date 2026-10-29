# Hypotheses

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696).

Each entry lists the suspected cause, the code involved, the `emulate.py` scenario that would
reproduce it (see [Scripts](scripts.md)), the production pattern `analyse.py` would show, the
evidence the [tracking columns](tracking-columns.md) would record, and a status: **open**,
**confirmed** or **ruled out**. This page is open: any sub-issue that finds a
new cause appends it here instead of tracking it elsewhere, and #1704 updates the statuses.

Hypotheses describe what to verify, not how to abuse it.

Sessions created before the #1701 release have `NULL` tracking columns: for them only the
heuristic *Production pattern* applies.

## 1. IP flip from Tent custom handlers (top suspect)

- **Description:** per [Client IP integrity](../../statistics.md#client-ip-integrity), requests
  served through Tent's custom `BackendClient` handlers (`cache.php`, `delete.php`,
  `uploads.php`) drop `X-Proxy-Secret` / `X-Forwarded-For`, so Django records Tent's IP for
  them. A session is reused only while `session.ip` matches, so mixing standard-rule and
  custom-handler requests during navigation (or a refresh) flips the recorded IP and creates a
  new session on each flip.
- **Code:** `backend/common/client_ip.py`, `proxy/extension/` (custom handlers),
  `StatisticsSessionMiddleware._load_or_create_session`.
- **Emulation:** a mix of standard-rule and custom-handler requests with one cookie jar.
- **Production pattern:** sessions of the same visitor alternating between the client IP and a
  fixed proxy IP, created close in time.
- **Tracking evidence:** `ip_changed` sessions whose `first_path` is a route served by a custom
  handler (`cache.php`, `delete.php`, `uploads.php` routes).
- **Status:** open.

## 2. Refresh + parallel requests

A page refresh fires several API requests at once. Three variants:

- **2a. No-cookie race:** on a first load without a cookie, each parallel request creates its
  own `Session`. The last `Set-Cookie` wins and the others become single-hit orphans.
- **2b. Login-rotation race:** each parallel authenticated request carrying the same anonymous
  cookie rotates that session in `_backfill_user`, creating several user-tied sessions.
- **2c. `Set-Cookie` ordering:** a slower, earlier response overwrites a newer cookie in the
  browser, so the next request presents an older (or orphaned) session.
- **Code:** `backend/statistics/middleware.py`, `session_attachment.py`, `cookies.py`.
- **Emulation:** the refresh burst, with and without a cookie, anonymous and logged in, with
  `Set-Cookie` applied in response arrival order.
- **Production pattern:** several sessions created within milliseconds of each other on the
  same domain and IP, most of them single-hit; or several user-tied sessions created at the
  same instant for one user.
- **Tracking evidence:**
  - 2a: several `no_cookie` sessions created within milliseconds, each with a different API
    `first_path`;
  - 2b: several `login_rotation` sessions for one user at the same instant;
  - 2c: no reason of its own (the older session is reused); visits whose `last_path` alternates
    between two sessions, or `cookie_session_not_found` if the older one was deleted.
- **Status:** open.

## 3. Other IP change

- **Description:** the client IP really changes: IPv4/IPv6 switching, mobile networks, or an
  edge proxy/CDN in front of Tent (see the caveat in
  [Client IP integrity](../../statistics.md#client-ip-integrity)).
- **Code:** `backend/common/client_ip.py`, `StatisticsSessionMiddleware._load_or_create_session`.
- **Emulation:** an IP change through `X-Forwarded-For` (local stack only).
- **Production pattern:** consecutive sessions of the same user on different IPs, no burst.
- **Tracking evidence:** `ip_changed` with an ordinary `first_path`, no burst.
- **Status:** open. A real client IP change is a [legitimate new session](symptom.md#legitimate-new-sessions);
  only an IP change caused by the infrastructure counts as the bug.

## 4. Domain mismatch

- **Description:** host variations (`www.` prefix, a port, an unregistered host resolved to a
  `None` domain) make `session.domain_id` differ between requests of one visitor.
- **Code:** the domain lookup in `StatisticsSessionMiddleware`, the `Domain` model.
- **Emulation:** a host change mid-navigation.
- **Production pattern:** sessions of the same visitor on different domains (or "unknown").
- **Tracking evidence:** `domain_changed`.
- **Status:** open.

## 5. Proxy/cache replaying `Set-Cookie`

- **Description:** a response cached by Tent still carries a `Set-Cookie` header, so later
  visitors would receive another session's cookie. To verify only: whether cached responses
  ever keep `Set-Cookie`.
- **Code:** Tent cache rules and `cache.php`, `X-Skip-Cache` handling.
- **Emulation:** requests to cached routes, checking the response headers.
- **Production pattern:** one session shared by unrelated visitors, or sessions whose cookie
  never comes back.
- **Tracking evidence:** `ip_changed`, or one session shared by unrelated visitors, whose
  `first_path` is a cached route.
- **Status:** open. If confirmed, it is reported privately first (see
  [Privacy](privacy.md#exploitable-findings)).

## 6. Cookie not stored or not sent

- **Description:** the cookie attributes (`Secure`, `SameSite=Lax`, domain, path, max-age)
  prevent the browser from storing or sending the cookie in some situations.
- **Code:** `backend/statistics/cookies.py`, `SESSION_COOKIE_SECURE` and related settings.
- **Emulation:** a browser-like cookie jar honouring the attributes, over HTTP and HTTPS.
- **Production pattern:** a stream of single-hit sessions from one IP and domain.
- **Tracking evidence:** a stream of `no_cookie` sessions whose `first_path` is not an entry
  page.
- **Status:** open.
