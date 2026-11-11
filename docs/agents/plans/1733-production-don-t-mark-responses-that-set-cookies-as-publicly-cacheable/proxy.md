# Proxy Plan: Production: don't mark responses that set cookies as publicly cacheable

Main plan: [plan.md](plan.md)

## Shared contracts

- The backend now sends `private, max-age=<anon>` on anonymous responses that set a cookie,
  `public, max-age=<anon>` on those that don't, and `no-store` for Bearer, `X-Skip-Cache` and
  errors.
- The `.htaccess` must never override a backend `Cache-Control`. It only fills in
  `max-age=10, public` when none is present and the request has no `Authorization` header.

## Implementation Steps

### Step 1 — `setifempty` in the production `.htaccess`

In `proxy/prod_htaccess/.htaccess`, replace the last line with:

```apache
Header setifempty Cache-Control "max-age=10, public" "expr=-z %{req:Authorization}"
```

Update the comment above it: never override the backend's `Cache-Control`, and never mark
Bearer responses public.

Check that `setifempty` sees the `Cache-Control` sent by PHP under mod_fcgid. The `Header`
directive's default `onsuccess` table may not hold CGI-generated headers. If the Tent image
(`darthjee/tent-test`, or the production image via docker-compose) runs Apache with
`mod_headers`, verify both cases there:

- a PHP response that sets `Cache-Control` keeps it;
- a static file gets `max-age=10, public`.

If the default condition misses the PHP header, use `Header always setifempty ...`. If neither
sees it, fall back to an explicit condition in the expression
(`&& -z resp('Cache-Control') && -z resp('Set-Cookie')`) and record which form was verified.
If no Apache is available locally, record that the rule is verified in production after
deploy (see Notes).

### Step 2 — Docs

Update `docs/agents/architecture/proxy.md`, section "Production `.htaccess`":

- The `Cache-Control` bullet: the `.htaccess` now uses `setifempty`. The backend's value always
  wins (`private` for cookie-setting responses, `no-store` for Bearer), and only responses
  without a `Cache-Control` (static assets) get `max-age=10, public`. State the rule that a
  response with `Set-Cookie` is never `public`, referencing #1733.
- The "To verify after a release" bullet:
  - a tracked JSON endpoint requested without a cookie returns `Set-Cookie` and no `public`;
  - a static asset still returns `max-age=10, public`;
  - a Bearer request still gets no `public`;
  - the statistics cookie shows `Secure` once `SESSION_COOKIE_SECURE=true` is set on Render.
- One line: Tent's file cache is unaffected. It decides storage by `skip_cache_header` and the
  response code, not by `Cache-Control`, and strips `Set-Cookie` before storing.

## Files to Change

- `proxy/prod_htaccess/.htaccess`: `setifempty` and the comment.
- `docs/agents/architecture/proxy.md`: the rule and the post-release checks.

## CI Checks

- `proxy`: `vendor/bin/phpcs` and `phpunit` in the Tent test image (CI job:
  `proxy_extension_tests`), through docker-compose. Nothing there tests `.htaccess`, so this
  only confirms nothing else broke.
- Docs: markdownlint (CI job: Check Markdown Lint), through docker-compose/make.

## Notes

- The `.htaccess` is deployed by CI (`copy_proxy_configuration`); never edit it on the server.
- Production verification after deploy is manual (owner). So are setting
  `SESSION_COOKIE_SECURE=true` on Render and confirming the edge/CDN does not cache `*.json`.
- Repo is public: no production hostnames, paths or IPs in the file, docs or PR.
