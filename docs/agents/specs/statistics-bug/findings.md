# Findings

Part of the [Statistics Bug](../statistics-bug.md) specs (Epic #1696).

Written by #1704, following the rules in [Privacy](privacy.md): only aggregated or anonymised
evidence. Reports stay git-ignored in `investigations/statistics-bug/reports/`.

## Root cause

**The backend recorded an infrastructure IP instead of the visitor's, and that IP changed from
request to request.** `StatisticsSessionMiddleware._load_or_create_session` only reuses a
cookie-borne session while `session.ip` matches the request's IP, so almost every request opened
a new session with `creation_reason=ip_changed`.

`common/client_ip.py` only trusts `X-Forwarded-For` when the request carries the proxy's
`X-Proxy-Secret`; otherwise it records `REMOTE_ADDR`. On the backend's hosting, `REMOTE_ADDR` is
an internal load-balancer address (private range) that rotates between requests. Two paths led
there:

1. **A public host that reaches the backend directly (main cause).** Besides the main site,
   which goes through the Tent proxy, a second public host (registered as a `Domain`) is a custom
   domain routed straight to the backend's hosting. Requests to it never pass through Tent, so
   they never carry `X-Proxy-Secret` and always record the rotating internal IP. This host
   accounts for almost all sessions in every production run (343 of 344 before the hotfix below,
   198 of 205 after it).
2. **The proxy secret was missing.** The proxy's `$proxySecret` (server-side
   `configuration/locals.php`) and the backend's `PROXY_SECRET` were both unset in production.
   `$proxySecret` was added to `locals.php.sample` in #1501, but CI carries the server's existing
   `locals.php` into each release, so the key never reached production. Requests through the
   main site were therefore recorded with the internal IP too.

The volume comes from **automated traffic**: the inflated sessions are anonymous, have one or two
hits, and their only path is `unresolved`, i.e. requests to `.json` paths that match no route.
Such requests still reach the backend (404) and are tracked, and clients that keep cookies
produced one new session per request while the IP rotated.

Hotfix (2026-11-02): the proxy secret was set on both sides with matching values. Main-site
sessions created afterwards record the visitor's public IP and are reused across requests
(preventing a silent regression is tracked in #1732). The direct host is not affected by the
hotfix and keeps producing `ip_changed` sessions.

## Evidence per hypothesis

Production numbers come from `analyse.py --production --anonymised`.

| Metric | Before the hotfix (2026-10-31..2026-11-01) | After the hotfix (2026-11-03..2026-11-07) |
|---|---|---|
| Sessions analysed | 344 (all anonymous) | 205 (all anonymous) |
| Sessions on the direct host | 343 | 198 |
| Sessions per creation reason | `ip_changed` 250, `no_cookie` 93, `cookie_session_not_found` 1 | `ip_changed` 175, `no_cookie` 30 |
| Extra sessions (same visitor, grouped) | 237: `ip_change` 226, legitimate 10, other 1 | 175: `ip_change` 173, race 1, legitimate 1 |
| `first_path` of `ip_changed` sessions | `unresolved` 247, admin route 3 | `unresolved` 174, admin route 1 |
| Recorded IPs | private range, rotating | private range on the direct host, public on the main site |
| `domain_changed` sessions | 0 | 0 |

After the hotfix, 176 of the direct-host sessions were created within about two minutes on a
single day: one automated client, split into one session per request.

**Main site after the hotfix (2026-11-02, check run):** sessions created after the change record
a public client IP that stays stable across requests; one session collected 10 hits. The first
request of an existing visitor opens one `ip_changed` session (its cookie still points at a
session recorded with the old private IP); this is a one-off transition.

### 1. IP flip from Tent custom handlers — confirmed in code, low volume

`BackendClient` (used by the `cache.php`, `delete.php` and `uploads.php` handlers) forwards an
allow-list of headers (`ForwardedHeaderFilter`) that includes `Cookie` but not
`X-Forwarded-For` or `X-Proxy-Secret`. Requests through these handlers are therefore recorded
with the infrastructure IP and split the visitor's session. They only serve `DELETE` requests,
upload submissions and the staff cache endpoints, so production volume is low: none of the
inflated sessions above starts on one of those routes.

### 2. Refresh + parallel requests

- **2a. No-cookie race — reproduced locally, amplified by the proxy cache.** Responses served from Tent's
  file cache never reach the backend, so they carry no `Set-Cookie` and are not tracked. A
  visitor whose first requests are cache hits has no cookie when its first uncached requests fire
  in parallel, and each of them creates a `no_cookie` session.
- **2b. Login-rotation race — confirmed in code and reproduced locally.** `_backfill_user` always rotates a pre-existing
  anonymous session for an authenticated request, so parallel authenticated requests carrying the
  same anonymous cookie each create a `login_rotation` session. Seen in production
  (2026-11-02: 3 `login_rotation` sessions, 2 of them within the race window).
- **2c. `Set-Cookie` ordering — not observed.**

### 3. Other IP change — confirmed: root cause

See [Root cause](#root-cause): an IP change caused by the infrastructure (the hosting's rotating internal IP, on the direct host and, before the hotfix, on the main site). The edge in front of the proxy is not involved: after the hotfix
main-site sessions record the visitors' own IPs, not edge addresses.

### 4. Domain mismatch — ruled out

No `domain_changed` session in any production run. A handful of sessions resolve to no domain
(`unknown`); they are isolated and do not split visitors.

### 5. Proxy/cache replaying `Set-Cookie` — ruled out for Tent's cache

Tent's `FileCacheMiddleware` strips `Set-Cookie` before storing a response (default
`excluded_headers`, not overridden in `proxy/prod_configuration/`). Related hardening of the
production `Cache-Control` headers is tracked in #1733.

### 6. Cookie not stored or not sent — ruled out

The cookie is host-only, `Path=/`, `SameSite=Lax`, `HttpOnly`, with a two-year `Max-Age`: browsers
store and send it on every same-site request. The missing `Secure` attribute in production does
not affect storage over HTTPS; it is tracked in #1733.

## Reproducing scenario

`emulate.py` against the local stack (2026-11-08), cross-checked with
`analyse.py --validate`, which recovered every duplicate the scenarios produced:

| Scenario | Hyp. | Result |
|---|---|---|
| `first_visit` | - | one `no_cookie` session, as expected |
| `sequential_navigation` | - | session reused, as expected |
| `refresh_burst_no_cookie_anonymous` | 2a | **reproduced**: 3 `no_cookie` sessions from one burst; the 2 other backend-bound responses were cache hits and set no cookie |
| `refresh_burst_with_cookie_anonymous` | 2c | session reused, as expected |
| `refresh_burst_with_cookie_logged_in` | 2b | **reproduced**: 2 `login_rotation` sessions from one burst |
| `mixed_handlers` | 1 | **reproduced**: 2 `ip_changed` sessions (into and out of a custom-handler route) |
| `login_mid_navigation` | 2b | no `login_rotation` session where one was expected; to be explained by the fix issue |
| `ip_change` | 3 | **reproduced**: one `ip_changed` session per IP change |
| `host_change` | 4 | one `domain_changed` session, as expected (not seen in production) |

**Root-cause scenario:** `ip_change`. One cookie jar whose client IP changes between requests
creates an `ip_changed` session per change; in production the IP changed on almost every request
because the infrastructure IP was recorded (on the direct host, it still does).

## Proposed solution direction

For the fix issue created by #1705:

1. **Do not track unresolved routes.** Requests that match no backend route (404 on unknown
   `.json` paths) should not create or touch a statistics session.
2. **Custom handlers forward the signed client IP.** `BackendClient` sets `X-Forwarded-For` and
   `X-Proxy-Secret` the same way `SetClientIpMiddleware` does, so every route records the same IP.
3. **Requests that bypass the proxy record a usable client IP, or are not exposed.** The direct
   host must stop recording the hosting's internal IP. Options: route that host through the
   proxy (or redirect it to the main site); derive the client IP from the hosting edge's own
   trusted header for requests that do not come from Tent; or do not track requests that carry
   no trusted client IP. Which one depends on whether the direct host has a legitimate use
   (for example API clients); the owner decides.
4. **Reconsider splitting a session on an IP change alone.** A valid signed cookie already
   identifies the visitor; creating a new session whenever the IP differs is what turned the
   infrastructure IP into the inflation. Options: reuse the session and update its IP (keeping
   the change visible, e.g. on the `Visit`), or only split after a gap. The trade-off is losing
   the per-IP session boundary the current design relies on.

Operational safeguards (not part of the code fix): #1732 (proxy secret check) and #1733
(cache headers, `Secure` cookie).

## Regression test scenario

For the fix issue: a backend test where one signed cookie is presented on consecutive requests
with different client IPs (trusted through the proxy, and separately untrusted, as on the direct host) must reuse a
single session instead of creating `ip_changed` sessions; a request to an unresolved route must
not create a session; parallel authenticated requests with one anonymous cookie must create at
most one `login_rotation` session.
