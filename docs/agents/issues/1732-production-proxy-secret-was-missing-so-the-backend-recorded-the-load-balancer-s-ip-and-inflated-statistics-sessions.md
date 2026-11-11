# Issue: Production: proxy secret was missing, so the backend recorded the load balancer's IP and inflated statistics sessions

## Description

Part of the statistics bug fix work (Epic #1696 findings, fix Epic #1736). In production, the Tent
proxy's `$proxySecret` (server-side `configuration/locals.php`) and the backend's `PROXY_SECRET`
(Render env var) were both unset. Tent sent no `X-Proxy-Secret`, so Django ignored
`X-Forwarded-For` (`backend/common/client_ip.py`) and recorded `REMOTE_ADDR`: an internal
load-balancer address (private `10.x`) that changes from request to request. Before #1737 this
was the main cause of the inflated statistics sessions (one `ip_changed` session per request).

**Hotfix already applied by hand on 2026-11-02:** the secret is now set on both sides, with
matching values.

**Why this is still needed after #1737:** #1737 reuses the session across IP changes, so a missing
secret no longer inflates sessions. It would still silently break IP accuracy:

- `Session.ip`, `Visit.first_ip` and `Visit.last_ip` (#1737, shown to staff by #1745) would hold
  the rotating load-balancer address instead of the visitor's IP;
- since that address changes almost every request, `Session.ip` ("written only when it changes")
  would be rewritten on nearly every hit;
- nothing in CI, the deploy or the backend notices it.

The proxy-secret-gated client IP is only used by statistics (the login-approval IP reads
`REMOTE_ADDR` directly and is not affected). This issue keeps the configuration from silently
breaking again.

## Problem

Evidence (anonymised; production export, analysed with `investigations/statistics-bug/analyse.py`):

- 2026-10-31..2026-11-01: all sessions recorded private `10.x` IPs; most were created with
  `ip_changed`.
- 2026-11-02, after only the proxy side was set: still private IPs (the backend had no
  `PROXY_SECRET` to match). After the backend side was set too: public IPs and session reuse.

Why it went unnoticed:

- `$proxySecret` was added to `proxy/prod_configuration/locals.php.sample` in #1501, but CI
  (`Setup locals`, `bin/deploy_frontend.sh copy_files`) carries the server's existing
  `locals.php` into each release, so the new key never reached production.
- `PROXY_SECRET` is not checked by CI or the deploy, and an empty value silently disables trust
  on both sides by design (`SetClientIpMiddleware`, `client_ip.py`).
- Same class of problem as #1729: production configuration that lives only on the server.

## Expected Behavior

- The proxy deploy **fails** when the release's `configuration/locals.php` does not define a
  non-empty `$proxySecret`.
- The backend logs a warning at startup when it runs with production settings and
  `PROXY_SECRET` is empty, instead of silently recording proxy IPs.
- The required production configuration keys, and the rule that both values must match, are
  documented.

## Solution

1. **Deploy-time check (infra):** after `Setup locals` in `.circleci/config.yml`, fail the proxy
   deploy when the release's `configuration/locals.php` does not define a non-empty
   `$proxySecret`. The check never prints the value (CI logs are public).
   - `copy_files` copies the server's existing `locals.php` into the release directory over SSH,
     so the check runs there too: a new `bin/deploy_frontend.sh` action (e.g. `check_locals`),
     run right after `Setup locals`, that includes the release copy with the server's `php`
     and exits non-zero when `$proxySecret` is unset or empty, printing only pass/fail.
   - Verified read-only on the production server (with the owner's authorization, 2026-11-11):
     the current `locals.php` defines a non-empty `$proxySecret` (set by the 2026-11-02 hotfix),
     and `php` is available there, so the check passes on the next deploy.
2. **Backend visibility (backend):** log a warning at startup when `PROXY_SECRET` is empty and
   the app runs with production settings. Do not change the trust logic.
3. **Docs (infra):** document the production configuration keys (`locals.php` keys and the Render
   env vars they pair with, including `PROXY_SECRET`) and the rotation procedure: generate a long
   random value (e.g. `openssl rand -hex 32`), set it on both sides, redeploy the backend.
4. Never commit, print or log the secret value.

## Out of scope

- Session handling on IP changes (#1737); the visit IP UI (#1745); the direct host that bypasses
  the proxy; `Secure` cookie (#1733).

## Verification

- A deploy whose `locals.php` lacks `$proxySecret`, or sets it empty, fails; with it present, it
  passes. Covered by a test of the check script.
- Backend test: the warning is logged with production settings and an empty `PROXY_SECRET`, and
  not when it is set.
- New production sessions keep recording public client IPs.

## Agents

- infra (deploy check, docs)
- backend (startup warning)
