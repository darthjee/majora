# Issue: Production: don't mark responses that set cookies as publicly cacheable

## Description

Found during the statistics-bug code review (#1704, Epic #1696). This is hardening; no active
problem has been observed. It is not the cause of the statistics bug (#1737/#1745 fix that), but
it closes a way statistics could break again: a shared cache that stored a response together
with its `Set-Cookie` would hand one visitor's statistics cookie to others and merge their
sessions.

Today, almost every anonymous JSON response is marked as publicly cacheable while it also sets
a per-visitor cookie:

- `StatisticsSessionMiddleware` sets the statistics cookie on **every** tracked response, not
  only the first (`_set_cookie`).
- The backend's `games.middleware.CacheControlMiddleware` sets `public, max-age=<anon>` on every
  successful anonymous response.
- The versioned production `.htaccess` (`proxy/prod_htaccess/.htaccess`, deployed by CI since
  #1729) then overwrites it with `Header set Cache-Control "max-age=10, public"` on every
  response that is not token-authenticated.

Nothing stores these responses today: Tent's file cache strips `Set-Cookie` before storing
(default `excluded_headers`, not overridden in `proxy/prod_configuration/`), and the edge in
front of the proxy treats JSON as dynamic. Correctness should not depend on that staying true.

Also, the statistics cookie is sent without `Secure` in production
(`secure=django_settings.SESSION_COOKIE_SECURE`, which defaults to `false`), although the site is
served over HTTPS.

## Expected Behavior

- A response carrying `Set-Cookie` is never sent with `Cache-Control: public`. Anonymous
  successful responses that set a cookie get `private, max-age=<anon>` instead.
- Responses without `Set-Cookie` keep today's caching: the backend's `public, max-age=<anon>`
  for anonymous responses, and `max-age=10, public` from the `.htaccess` for responses the
  backend did not tag (e.g. static assets).
- Token-authenticated responses keep the rule from #1729 (never `public`, backend `no-store`
  kept). `X-Skip-Cache` / `no-store` and authenticated `private` responses are unchanged.
- The `.htaccess` no longer overrides a `Cache-Control` the backend already set.
- The production statistics cookie has the `Secure` attribute.
- Every change goes through the versioned files; nothing is edited by hand on the server.

Accepted trade-off: most anonymous JSON becomes non-storable by shared caches. Nothing stores
it today, so this has no practical cost.

## Solution

1. **Backend `CacheControlMiddleware` (backend):** in `_apply_public_cache_control`, when the
   response carries a cookie (`response.cookies` not empty), use `private, max-age=<anon>`
   instead of `public, max-age=<anon>`. This also covers the `/permissions/` path, which always
   takes the public tier. The middleware runs after `StatisticsSessionMiddleware` has set the
   cookie, because it is listed after it in `MIDDLEWARE` and response middlewares run in
   reverse order. Confirm this in a test rather than assuming it.
2. **Proxy `.htaccess` (proxy/infra):** in `proxy/prod_htaccess/.htaccess`, replace `Header set`
   with `Header setifempty`, keeping the Bearer condition, so it only fills in a value when the
   backend sent none:

   ```apache
   Header setifempty Cache-Control "max-age=10, public" "expr=-z %{req:Authorization}"
   ```

   Verify that Apache sees the backend's `Cache-Control` coming from PHP/FastCGI at that point
   (it may live in `err_headers_out`; use the `always` condition if needed). If `setifempty`
   cannot see it, also skip responses with `Set-Cookie` (`&& -z resp('Set-Cookie')`).
3. **Cookie `Secure` (manual, owner):** set `SESSION_COOKIE_SECURE=true` in the backend's
   Render environment. Document it as required in `docs/agents/production-configuration.md`.
   No code change: `_set_cookie` already reads the setting.
4. **Docs:** update `docs/agents/architecture/proxy.md` (production `.htaccess`) and the backend
   caching docs with the rule: a cookie means never `public`, and the backend's value wins over
   the `.htaccess`.
5. **Edge cache (manual, owner):** confirm that no edge/CDN rule caches `*.json` responses.

## Out of scope

- Stopping the statistics cookie from being re-sent on every response (that would keep more
  responses publicly cacheable, but it is a larger change).
- Tent's file cache (already strips `Set-Cookie`).
- The statistics session fixes (#1737, #1745) and the proxy secret (#1732).

## Verification

- Backend tests (pytest): an anonymous successful response with a cookie gets
  `private, max-age=<anon>`; without a cookie it gets `public, max-age=<anon>`; `/permissions/`
  with a cookie gets `private`; error, `X-Skip-Cache` and authenticated cases are unchanged; a
  full request through the middleware stack (statistics cookie set) never ends up `public`.
- Proxy: if the rule is testable in the Tent image, check that `setifempty` keeps a backend value
  and fills in a missing one, and that a Bearer request never gets `public`.
- Production, after deploy: a tracked JSON endpoint returns `Set-Cookie` and no `public`; a static
  asset still returns `max-age=10, public`; a Bearer request still gets no `public`; the
  statistics cookie shows `Secure` (after step 3).

## Agents

- backend (`CacheControlMiddleware`, tests, backend docs)
- proxy / infra (`.htaccess`, `proxy.md`, `production-configuration.md`)
