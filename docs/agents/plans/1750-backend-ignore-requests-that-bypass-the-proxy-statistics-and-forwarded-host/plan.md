# Plan: Backend: ignore requests that bypass the proxy (statistics and forwarded host)

Issue: [1750-backend-ignore-requests-that-bypass-the-proxy-statistics-and-forwarded-host.md](../../issues/1750-backend-ignore-requests-that-bypass-the-proxy-statistics-and-forwarded-host.md)

## Overview

Add a backend proxy-trust middleware, listed first in `MIDDLEWARE`. It marks each request
`request.via_proxy` from the `X-Proxy-Secret` header (an empty `PROXY_SECRET` means
trusted). For untrusted requests it strips `X-Forwarded-Host`, and it optionally rejects them
with 403 when `PROXY_ENFORCE=true` (only `/ready.json` is exempt). Statistics tracking skips
untrusted requests. The docs for production configuration, the client and the crawler are
updated so every caller targets the public proxy URL. Turning enforcement on in production is
tracked separately in #1768.

## Agents involved

- [backend](backend.md)
- [infra](infra.md)
- [client](client.md)
- [crawler](crawler.md)

## Shared contracts

- **`PROXY_SECRET`** (backend env, unchanged): a single shared value equal to Tent's
  `$proxySecret`. No comma-separated list.
- **`PROXY_ENFORCE`** (new backend env): `'true'` (case-insensitive) enables rejection; any
  other value or unset means off. Default off.
- **Trusted request:** `PROXY_SECRET` is empty, **or** `X-Proxy-Secret` matches it
  (constant-time, `common.secret_compare.secret_matches`).
- **Untrusted request behavior:**
  - soft mode (default): served; `X-Forwarded-Host` is removed before any `get_host()`;
    no statistics session, visit or cookie;
  - `PROXY_ENFORCE=true` with a non-empty `PROXY_SECRET`: `403` with body
    `{"detail": "Forbidden"}` and `Cache-Control: no-store`; never logged per request.
- **Exempt from enforcement:** exactly `/ready.json` (the platform health check), not a
  prefix and not configurable.
- **Caller rule:** every caller other than local development, tests and the health check
  (Navi, `majora-client` via `MAJORA_URL`, crawler via `MAJORA_API_BASE_URL`) must target
  the public proxy URL, never the backend's direct hostname. Locally that's the Tent proxy
  (`http://localhost:3000`), not `majora_app` on `http://localhost:3030`.
- **Secret mismatch** (rotation window or a typo): every request is untrusted, so domain
  resolution fails (`/games.json` returns 404 `domain_not_recognized`, and the domain config
  returns the default branding), and with enforcement on every request gets a 403. This is
  accepted; the docs describe it.
