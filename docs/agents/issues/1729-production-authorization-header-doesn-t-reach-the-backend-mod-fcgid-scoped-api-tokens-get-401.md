# Issue: Production: Authorization header doesn't reach the backend (mod_fcgid); scoped API tokens get 401

## Description

In production, the `Authorization` header never reaches the backend, so **no scoped API token
(`Authorization: Bearer mjr_…`) works**. Every Bearer request is treated as anonymous and gets
`401 {"errors": {"detail": ["authentication_required"]}}`. This affects the device-authorization
tokens used by `majora-client` and by the statistics-bug investigation (`analyse.py`, #1704):
the token is issued, then the first API call fails.

Locally everything works: the Tent Docker image runs PHP as an Apache module, which passes the
header through. This blocks the production run of #1704.

## Problem

Evidence (2026-11-02):

- `analyse.py --production`: the device authorization was approved and a `statistics:read`
  token issued, then `GET /staff/statistics/export.json` returned 401 `authentication_required`.
- A request with a well-formed but **fake** Bearer token gets the same 401
  `authentication_required`. If Django had received the header, `ApiTokenAuthentication` would
  have rejected it with `token_invalid` (`backend/accounts/authentication.py`), so the header is
  dropped before Django.
- The production proxy host runs Apache 2.4 with PHP under **mod_fcgid**. FastCGI/CGI doesn't
  pass `Authorization` to PHP unless configured to.
- Tent reads request headers with `getallheaders()` (`lib/models/Request.php`). Under CGI it
  is built from the `HTTP_*` variables, so with no `HTTP_AUTHORIZATION` there is no
  `Authorization` header to forward.

How the production `.htaccess` is deployed today (`.circleci/config.yml`):

- `upload_proxy_files` rsyncs the Tent image's `/var/www/html/` into the release, **including
  Tent's own `.htaccess`** (only `RewriteEngine On` + `RewriteRule ^(.*)$ index.php [QSA,L]`).
- `copy_proxy_configuration` (which `requires: [upload_proxy_files]`) then runs
  `Setup .htaccess`: `TARGET=.htaccess bin/deploy_frontend.sh copy_files`, which copies the
  `.htaccess` of the **currently live release on the server** over it. That file (rewrite to
  `index.php` + `Cache-Control`) is not versioned anywhere in this repository and has no
  `Authorization` passthrough.
- `Upload proxy configuration` uploads `proxy/prod_configuration/` to `configuration/`, not to
  the release root, so a file placed there would not become the root `.htaccess` by itself.

## Expected Behavior

- A request with a fake Bearer token gets `401 token_invalid` with
  `WWW-Authenticate: Bearer realm="api", error="invalid_token"`.
- A real scoped token (e.g. `statistics:read`) reaches its endpoint and succeeds.
- The production `.htaccess`, including the passthrough, is versioned in the repository and
  deployed by CI, so a fresh server or a lost file can't silently break tokens again.

## Solution

1. **Version the production `.htaccess`** in the repository (e.g.
   `proxy/prod_htaccess/.htaccess`, outside `proxy/prod_configuration/`, which is deployed to
   `configuration/`). Start from the current live server content:

   ```apache
   RewriteEngine On

   # Redirect ALL requests to index.php
   RewriteRule ^(.*)$ index.php [QSA,L]

   Header set Cache-Control "max-age=10, public"
   ```

2. **Pass the header through** by adding, before the existing rewrite rule:

   ```apache
   RewriteCond %{HTTP:Authorization} .
   RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
   ```

   (alternatives: `SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1`, or `CGIPassAuth On`,
   which needs `AllowOverride AuthConfig`).
3. **Deploy it from CI**: replace the `Setup .htaccess` `copy_files` step in
   `copy_proxy_configuration` with an upload of the versioned file to the release root. It must
   still run after `upload_proxy_files`, so it overwrites Tent's default `.htaccess`. No manual
   server hotfix: the fix ships with the next tagged release (the deploy workflow only runs on
   tags).
4. **Verify** in production after release: fake Bearer token → `401 token_invalid` with
   `WWW-Authenticate: Bearer realm="api", error="invalid_token"`; real scoped token → reaches its
   endpoint.
5. **Fallback only if needed**: after the internal rewrite to `index.php`, Apache may expose the
   variable only as `REDIRECT_HTTP_AUTHORIZATION`. Only if production verification shows the
   header still missing, the proxy extension adds a fallback that maps
   `REDIRECT_HTTP_AUTHORIZATION` to `Authorization` (with tests), in a follow-up. It is not part
   of this issue's initial change.
6. **Document** the requirement (Authorization passthrough under FastCGI; `.htaccess` is
   versioned and deployed from CI) in the proxy/infra docs.

Responsible agents:

- **infra:** the versioned `.htaccess`, the CI deploy change and the docs.
- **proxy:** confirm that Tent forwards the header once PHP receives it.

Security: passing `Authorization` through is expected; the backend already validates Bearer
tokens and `BearerSkipCacheMiddleware` keeps Bearer responses out of the proxy cache.

## Benefits

- Scoped API tokens (`majora-client`, device authorization, #1704's `analyse.py`) work in
  production.
- The production `.htaccess` stops being an unversioned, server-only file.
