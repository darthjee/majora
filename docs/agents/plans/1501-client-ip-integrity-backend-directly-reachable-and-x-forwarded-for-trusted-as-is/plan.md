# Plan: Client IP integrity: backend directly reachable and X-Forwarded-For trusted as-is

Issue: [1501-client-ip-integrity-backend-directly-reachable-and-x-forwarded-for-trusted-as-is.md](../../issues/1501-client-ip-integrity-backend-directly-reachable-and-x-forwarded-for-trusted-as-is.md)

## Overview
Tent proves a request came through it by sending a shared-secret header to Django on every rule that proxies to the backend. Django trusts `X-Forwarded-For` only when that secret matches, and then uses the leftmost entry, the one Tent set. Any other request falls back to `REMOTE_ADDR`, and nothing is rejected. The access-control and statistics docs are corrected to describe the real topology: Django is publicly reachable on Render.

## Agents involved

- [proxy](proxy.md)
- [backend](backend.md)
- [infra](infra.md)

## Shared contracts

- **Header:** `X-Proxy-Secret` (Django: `request.META['HTTP_X_PROXY_SECRET']`).
- **Env var:** `PROXY_SECRET`, the same value on both sides.
  - Django reads it with `os.environ.get('PROXY_SECRET', '')`.
  - Dev Tent reads it with `getenv('PROXY_SECRET')` in `proxy/dev_configuration/locals.php` (`majora_proxy` already loads `.env`).
  - Prod Tent gets it from `$proxySecret` in the server-side `locals.php`, which is copied at deploy time and not stored in the repo. `locals.php.sample` documents the variable.
- **Empty secret = disabled.** Tent sends no `X-Proxy-Secret`, and Django never trusts `X-Forwarded-For` (it uses `REMOTE_ADDR`). A non-matching or missing header is treated the same way: ignored, never rejected.
- **`X-Forwarded-For` semantics:** Tent always replaces the header with exactly one value, its `REMOTE_ADDR` (existing `SetClientIpMiddleware` behavior). Downstream hops (Render) may append entries. Django takes the leftmost comma-separated entry, strips it, and validates it as an IP. If the entry is invalid, Django falls back to `REMOTE_ADDR`.
- **Client-supplied `X-Proxy-Secret`:** Tent always strips it before setting its own, so a request through Tent can never carry a guessed secret.
