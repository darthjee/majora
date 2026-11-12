# Issue: Backend: ignore requests that bypass the proxy (statistics and forwarded host)

## Description

Raised while refining #1739 (statistics bug fix Epic #1736). #1739 removes the direct host's
custom domain, but the backend is still a public service: the hosting's default hostname, and any
host routed straight to it, reach Django without going through the Tent proxy. Such requests
carry no valid `X-Proxy-Secret`, so `common/client_ip.py` records the hosting's rotating internal
IP and statistics sessions get inflated again.

## Problem

- Statistics tracking (`StatisticsSessionMiddleware`) runs for requests that did not come
  through the proxy.
- `X-Forwarded-Host` is not gated by the proxy secret either (see the comment above
  `USE_X_FORWARDED_HOST` in `backend/majora_project/settings.py`; a follow-up from #1501), so
  a direct caller can pick any domain.

## Expected Behavior

Requests without a valid proxy secret do not affect statistics, and cannot claim a domain they
did not come through.

## Solution

### Direction

Hybrid: a soft mechanism is always active, and hard rejection sits on top of it behind a flag.

- **Proxy-trust middleware (always on):** a single middleware, placed early in the stack,
  sets `request.via_proxy` from the existing `X-Proxy-Secret` check (the logic now private in
  `common/client_ip.py`, extracted into a shared helper). When `PROXY_SECRET` is empty (local
  development, tests), every request counts as `via_proxy = True`, so behavior there is
  unchanged.
- **Soft handling of untrusted requests:** they are still served, but:
  - `StatisticsSessionMiddleware` skips them (no session, no visit, no cookie);
  - `X-Forwarded-Host` is ignored, so `request.get_host()` falls back to `Host`;
  - `client_ip` keeps ignoring `X-Forwarded-For` (already the case).
- **Optional enforcement:** an environment flag (e.g. `PROXY_ENFORCE=true`, off by default)
  makes the same middleware reject untrusted requests with 403. The platform health-check
  path is exempt. The flag is only turned on once every legitimate direct caller has been
  checked or pointed at the proxy.

### X-Forwarded-Host gating

- The proxy-trust middleware deletes `HTTP_X_FORWARDED_HOST` from `request.META` when
  `request.via_proxy` is false. `USE_X_FORWARDED_HOST` stays `True`, so every existing
  `request.get_host()` caller (`domains/views/config.py`, `games/views/games/games_list.py`,
  `games/caches/domain_games_cache.py`, `statistics/middleware.py`, and Django's CSRF
  origin/referer check) is covered without changes.
- The middleware is the **first** entry in `MIDDLEWARE` (above `CorsMiddleware` and
  `SecurityMiddleware`), so nothing reads the host before it runs. Document the ordering in
  `settings.py` like the existing load-bearing ordering comments, and update the comment above
  `USE_X_FORWARDED_HOST`, which currently says the header is not gated.
- Expected behavior for a direct request: `get_host()` resolves to the backend's own hostname,
  which matches no `Domain`, so the existing unknown-host paths apply: `/games.json` returns
  404 `domain_not_recognized` (with `X-Skip-Cache`), and `/domain/config.json` returns the
  default branding. No new error path.

### Legitimate direct callers

Only these may reach the backend without the proxy:

- **Local development and tests:** `PROXY_SECRET` is empty, so every request is trusted and
  enforcement is a no-op.
- **The platform health check (`/ready.json`):** exempt from `PROXY_ENFORCE` rejection as an
  exact path (never a prefix), hardcoded next to the middleware the same way
  `StatisticsSessionMiddleware.UNTRACKED_PATHS` is. The exemption list is not configurable from
  the environment. In soft mode the health check is still served, and as an untrusted
  request it no longer creates statistics sessions.

Every other caller must go through the proxy:

- **Navi (cache warmer):** already targets the public proxy URL (`$MAJORA_PRODUCTION_URL`).
  No change.
- **`majora-client` and the crawler:** their base URL (`MAJORA_URL`, `MAJORA_API_BASE_URL`)
  must be the public proxy URL, never the backend's direct hostname. Document this in
  `client/README.md` and `crawler/RUNNING.md`.

### Edge cases

- **Secret mismatch or rotation:** `PROXY_SECRET` stays a single value. While the proxy and
  backend secrets differ (between the two services' redeploys during a rotation, or after a
  typo), every request is untrusted: `X-Forwarded-Host` is stripped, so no domain resolves
  (`/games.json` returns 404 `domain_not_recognized`, and the domain config returns the
  default branding), and once `PROXY_ENFORCE` is on, every request gets a 403. This is accepted. Document the
  rotation procedure (update both services back to back, preferably at low traffic, and expect
  a short disruption) next to the `PROXY_SECRET` / `PROXY_ENFORCE` env documentation.
- **Empty `PROXY_SECRET` means trusted for `via_proxy`:** `secret_matches` returns `False` for
  an empty secret, which `client_ip` relies on to ignore `X-Forwarded-For` locally. `via_proxy`
  needs the opposite default (empty secret → trusted), otherwise local development loses
  `X-Forwarded-Host`. The shared helper makes both behaviors explicit, and `client_ip`'s
  behavior is unchanged.
- **`PROXY_ENFORCE=true` with an empty `PROXY_SECRET`:** enforcement is a no-op. Log a startup
  warning (never including any secret value), next to `warn_if_proxy_secret_missing`.
- **A header that is present but wrong, empty or non-ASCII:** the request is untrusted
  (`secret_matches` already handles these with a constant-time comparison).
- **The 403 under enforcement:** a minimal body (`{"detail": "Forbidden"}`) that doesn't
  mention the proxy or the secret, `no-store` caching, and no per-request logging.
- **Exact health path:** only `/ready.json` is exempt, not `/ready.json/` and not a prefix.
  A health check that comes through the proxy is simply trusted.
- **What enforcement covers:** the middleware runs before routing, so under enforcement direct
  CORS preflights, 404s and unrouted paths are rejected too. In soft mode they behave as today.
  The statistics skip header doesn't matter for untrusted requests, which are skipped anyway.
- **Other forwarded headers:** only `X-Forwarded-Host` (and `X-Forwarded-For` in `client_ip`)
  are trusted today. `SECURE_PROXY_SSL_HEADER` / `USE_X_FORWARDED_PORT` are not set. Any
  future trust of a forwarded header must be gated by `via_proxy`; note this in the
  `settings.py` comment.

### Permissions

Effect of gating `X-Forwarded-Host` (today a direct caller can forge it):

| Area | Today (direct, forged host) | After |
|---|---|---|
| `GET /games.json` | Lists any domain's games (exposes unregistered or internal domains) | 404 `domain_not_recognized` |
| `POST /games.json` (authenticated, `games:write`) | Attaches a new game to any domain's `DomainGroup` | 404, nothing created |
| `/domain/config.json` | Any domain's branding | Default branding |
| Django CSRF origin/referer check (`get_host()`) | A forged host can make a cross-origin `Origin` look same-origin | Only the real `Host` is compared (stricter) |
| Authentication (session, bearer tokens, token scopes) | Doesn't depend on the proxy | Unchanged |
| Restricted endpoints and `X-Skip-Cache` | — | Unchanged |

Rules:

- `request.via_proxy` only decides whether forwarded headers are trusted and whether statistics
  are tracked. It is never used to grant or deny access to a resource, apart from the
  `PROXY_ENFORCE` 403.
- The domain is the visibility boundary for `/games.json`; after this change only the proxy can
  say which domain a request came from.
- The `data-access` and `security` reviewers check the change (visibility through domains,
  CSRF).
- Backend only: the frontend `RequestStore` / permission-resolver concern does not apply.

### Backward compatibility

- **Local development, tests and CI:** no change. `PROXY_SECRET` is empty there, so every
  request is trusted (e.g. `games_list_test.py` sends `X-Forwarded-Host` without setting
  `PROXY_SECRET` and keeps passing).
- **An existing test changes meaning:**
  `statistics/tests/middleware_test.py::test_forged_forwarded_for_without_proxy_secret_stores_remote_addr`
  sets `PROXY_SECRET` and sends no secret. The request is now untrusted, so no session is
  created; rewrite the test to assert nothing is tracked. `common/tests/client_ip_test.py` is
  unaffected.
- **Production traffic through the proxy:** no change, provided `PROXY_SECRET` is already set
  on both the proxy and the backend (the #1501 setup). If the production backend's
  `PROXY_SECRET` is empty, the change is a silent no-op. Verify this as a deploy note.
- **Statistics data:** existing sessions and visits are untouched. After deploy, session counts
  are expected to drop, because direct traffic (including the platform health check on
  `/ready.json`) is no longer counted. This is the intended fix, not a regression.
- **API contract:** no change to response shapes or endpoints. The only addition is the
  `PROXY_ENFORCE` env var, off by default.

### Scope

In scope:

- Extract the `X-Proxy-Secret` check from `common/client_ip.py` into a shared helper, and make
  `client_ip` reuse it.
- New proxy-trust middleware: sets `request.via_proxy`, strips `X-Forwarded-Host` from
  untrusted requests, and rejects them when `PROXY_ENFORCE=true` (except `/ready.json`).
- `StatisticsSessionMiddleware` skips untrusted requests.
- `settings.py`: the middleware goes first with an ordering comment, the
  `USE_X_FORWARDED_HOST` comment is rewritten, and the `PROXY_ENFORCE` flag is read.
- Tests covering all of the above.
- Docs: `PROXY_ENFORCE` in the env/infra documentation; the "use the proxy URL" note in
  `client/README.md` and `crawler/RUNNING.md`; updates to `docs/agents/access-control` and the
  security docs where they describe proxy trust; fix the stale `/health.json` entry in
  `docs/agents/access-control/endpoints.md` (the real endpoint is `/ready.json`).

Out of scope:

- Turning `PROXY_ENFORCE` on in production: tracked in #1768.
- Cleaning up statistics data that was already inflated (belongs to Epic #1736, if wanted).
- Restricting `ALLOWED_HOSTS` (currently `*`).
- Restricting access at the network or platform level (e.g. a private service).
- Changes to the Tent proxy (it already sends the secret).

### Constraints

- Local development and tests, which run without the proxy or with an empty `PROXY_SECRET`,
  keep working.
- Secrets are never hardcoded, printed or logged. The repository is public: no real hostnames
  or IPs.

### Responsible agents

backend; security and data-access reviews; infra if production configuration changes

## Benefits

- Statistics stop being inflated by traffic that bypasses the proxy (direct hits on the
  backend's default hostname, the platform health check).
- A direct caller can no longer claim a domain: no listing of, or creating games on, another
  domain via a forged `X-Forwarded-Host`, and a stricter CSRF origin check.
- One shared proxy-trust decision (`request.via_proxy`) that future forwarded-header trust can
  reuse, with a ready switch (`PROXY_ENFORCE`) to fully close the backend to direct traffic.
