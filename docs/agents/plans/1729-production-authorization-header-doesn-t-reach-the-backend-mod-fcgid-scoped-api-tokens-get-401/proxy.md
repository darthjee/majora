# Proxy Plan: Production: Authorization header doesn't reach the backend (mod_fcgid); scoped API tokens get 401

Main plan: [plan.md](plan.md)

## Shared contracts

- Produce `proxy/prod_htaccess/.htaccess` with exactly the content listed in
  [plan.md](plan.md#shared-contracts) (live server content + the `HTTP_AUTHORIZATION`
  passthrough placed **before** the `index.php` rewrite).
- The infra agent deploys that file unchanged to the release root as `.htaccess`.

## Implementation Steps

### Step 1 — Version the production `.htaccess`

Create `proxy/prod_htaccess/.htaccess` with the shared-contract content. Keep the
`Cache-Control` line exactly as on the live server. Confirm (by reading Tent's
`lib/models/Request.php` inside the `darthjee/tent:1.0.2` image) that Tent builds request headers
with `getallheaders()` and forwards `Authorization` to the backend unchanged once PHP receives
`HTTP_AUTHORIZATION`; `BackendRuleBearerCacheTest::testBearerRequestReachesBackendWithItsAuthorization`
already covers forwarding at the rule level, so no new PHP code or tests are expected.

### Step 2 — Document the requirement

In `docs/agents/architecture/proxy.md`, add `prod_htaccess/` to the folder tree and a short
"Production `.htaccess`" section explaining: production runs PHP under mod_fcgid, which doesn't
pass `Authorization` to PHP; the versioned `.htaccess` sets `HTTP_AUTHORIZATION` so scoped API
tokens work; it is deployed from CI by `copy_proxy_configuration` (overwriting Tent's default),
so any server-side change must be made in the repo instead; and how to verify (fake Bearer token →
`token_invalid`).

## Files to Change

- `proxy/prod_htaccess/.htaccess` — new; versioned production `.htaccess` with the passthrough.
- `docs/agents/architecture/proxy.md` — folder tree + production `.htaccess` section.

## CI Checks

- `docs/`: `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes

- Do not add a `REDIRECT_HTTP_AUTHORIZATION` fallback in the extension now; it is only a
  follow-up if production verification shows the header still missing.
