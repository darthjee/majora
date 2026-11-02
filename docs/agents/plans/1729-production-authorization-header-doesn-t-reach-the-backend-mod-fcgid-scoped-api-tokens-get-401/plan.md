# Plan: Production: Authorization header doesn't reach the backend (mod_fcgid); scoped API tokens get 401

Issue: [1729](../../issues/1729-production-authorization-header-doesn-t-reach-the-backend-mod-fcgid-scoped-api-tokens-get-401.md)

## Overview

Production runs PHP under mod_fcgid, which drops the `Authorization` header before Tent sees it,
so every scoped API token (`Bearer mjr_…`) gets `401 authentication_required`. The production
`.htaccess` is unversioned (CI copies the live server's copy into each release). This plan
versions it in the repo with an `HTTP_AUTHORIZATION` passthrough, and changes CI to deploy the
versioned file to the release root. The fix ships with the next tagged release; no manual server
hotfix.

## Agents involved

- [proxy](proxy.md)
- [infra](infra.md)

## Shared contracts

- **Versioned file path:** `proxy/prod_htaccess/.htaccess` (a directory of its own, holding only
  that file — not inside `proxy/prod_configuration/`, which CI uploads to `configuration/`).
- **Deploy target:** the file lands at the release root as `.htaccess`, next to `index.php`.
- **Deploy order:** the upload runs in `copy_proxy_configuration`, which already
  `requires: [upload_proxy_files]`, so it overwrites the Tent image's default `.htaccess`.
- **Exact file content** (proxy produces it, infra deploys it unchanged):

  ```apache
  RewriteEngine On

  # Pass the Authorization header to PHP under FastCGI (mod_fcgid), so scoped
  # API tokens (Authorization: Bearer ...) reach the backend.
  RewriteCond %{HTTP:Authorization} .
  RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

  # Redirect ALL requests to index.php
  RewriteRule ^(.*)$ index.php [QSA,L]

  # Never mark token-authenticated (Authorization: Bearer ...) responses as public,
  # so shared caches don't store them; the backend's no-store is kept.
  Header set Cache-Control "max-age=10, public" "expr=-z %{req:Authorization}"
  ```

## Verification (after the next tagged release)

- Fake Bearer token → `401` with `token_invalid` and
  `WWW-Authenticate: Bearer realm="api", error="invalid_token"`.
- Real scoped token (`statistics:read`) → `GET /staff/statistics/export.json` succeeds.
- Bearer request → response does not carry `Cache-Control: max-age=10, public` (the
  backend's `no-store` is kept).
- If the header is still missing, open a follow-up for a proxy-extension fallback mapping
  `REDIRECT_HTTP_AUTHORIZATION` to `Authorization` (out of scope here).
