# Production Configuration

Production settings that live **outside git**: the Tent proxy's server-side `locals.php` and
the backend's Render environment variables. Nothing here is deployed from the repository, so a
missing key breaks production silently unless something checks it (#1732).

This page lists key **names and purposes only**. Never write a real value, hostname or
server path here, in a commit, in a PR or in CI output: the repository and its CI logs are
public.

## Proxy: `configuration/locals.php`

Server-side file read by the Tent proxy rules (`proxy/prod_configuration/rules/`). The
template is `proxy/prod_configuration/locals.php.sample`; the real file is not in git.

| Key | Purpose |
|-----|---------|
| `$backendHost` | Base URL of the Django backend that the proxy rules forward to. |
| `$photosPath` | Server folder where uploaded photos are stored and served from. |
| `$filesPath` | Server folder where other uploaded files are stored and served from. |
| `$staticRoot` | Root folder of the site on the server (static frontend assets). |
| `$cacheFolder` | Folder where Tent stores cached backend responses (one subfolder per domain). |
| `$proxySecret` | Shared secret Tent sends to Django as `X-Proxy-Secret`. Must be non-empty and equal to the backend's `PROXY_SECRET` (see [Pairing rule](#pairing-rule-proxysecret-and-proxy_secret)). |

### How the file reaches a release

CI does **not** generate `locals.php`. The `copy_proxy_configuration` job (`Setup locals`
step, `bin/deploy_frontend.sh copy_files`) copies the server's **current** `locals.php` into
the new release directory. Consequences:

- A key added to `locals.php.sample` never reaches production on its own. Add it to the
  server's `locals.php` **by hand, before** the deploy that needs it.
- Editing `locals.php` on the server is safe: the next release carries it over.

### Deploy check (`Check locals`)

Right after `Setup locals`, the `Check locals` step runs
`bin/deploy_frontend.sh check_locals`. It runs `php` on the server against the release's copy
of `locals.php` and fails unless the file defines a non-empty string `$proxySecret`:

- Pass: prints `locals.php: $proxySecret is set`, exit code `0`.
- Fail: prints `locals.php: $proxySecret is missing or empty` to stderr, exit code `1`. A
  missing file, or a file that does not load (syntax error, exception), fails the same way.
- It never prints the value, the file path, the file's own output or a PHP error.
- A failure stops the workflow before the `release` job, so the live site keeps its current
  release. Fix `locals.php` on the server and re-run the job.

Only `$proxySecret` is enforced. The check does not compare it with the backend's
`PROXY_SECRET`; a mismatch is not caught by the deploy.

No CI job tests `bin/` scripts. To change the check, run it locally in the Tent image
(`docker-compose run --rm --no-deps majora_proxy ...`) against temporary files holding dummy
values: a file without the key and one with `''` must exit `1`, one with a dummy value must
exit `0`, and no output may contain the value.

## Backend: Render environment variables

Set on the Render backend service. Read by `backend/majora_project/settings.py` unless noted.

| Variable | Purpose |
|----------|---------|
| `PROXY_SECRET` | Shared secret expected in `X-Proxy-Secret` (`backend/common/client_ip.py`). Must be non-empty and equal to Tent's `$proxySecret`. |
| `DJANGO_SECRET_KEY` | Django `SECRET_KEY`. |
| `DJANGO_DEBUG` | `false` in production. Also the switch that enables the `PROXY_SECRET` startup warning. |
| `ALLOWED_HOSTS` | Comma-separated hosts Django answers for. |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated origins trusted for CSRF. |
| `MAJORA_MYSQL_NAME`, `MAJORA_MYSQL_USER`, `MAJORA_MYSQL_PASSWORD`, `MAJORA_MYSQL_HOST`, `MAJORA_MYSQL_PORT` | Database connection. |
| `SESSION_COOKIE_SECURE` | **Required: `true` in production** (#1733). Adds `Secure` to the session cookie and to the statistics cookie, so both are sent over HTTPS only. Defaults to `false` when unset. |
| `DJANGO_EMAIL_BACKEND`, `DJANGO_EMAIL_HOST`, `DJANGO_EMAIL_PORT`, `DJANGO_EMAIL_HOST_USER`, `DJANGO_EMAIL_HOST_PASSWORD`, `DJANGO_EMAIL_USE_TLS`, `DJANGO_DEFAULT_FROM_EMAIL` | Outgoing email. |
| `FRONTEND_BASE_URL` | Base URL used to build links sent in emails. |
| `DJANGO_LOG_LEVEL` | Level of the `accounts`, `common` and `staff` loggers (default `INFO`). |

App-level settings read elsewhere (`backend/games/settings.py`,
`backend/statistics/settings.py`, `backend/majora_project/cache/settings.py`), such as
`EMAILS_ENABLED`, `STATISTICS_SKIP_SECRET` and the `MAJORA_*` tunables, have working defaults
and are described in `.env.dev.sample`.

## Pairing rule: `$proxySecret` and `PROXY_SECRET`

`$proxySecret` (proxy) and `PROXY_SECRET` (backend) must hold the **same non-empty value**.

- Tent sends the secret as `X-Proxy-Secret` with its own `X-Forwarded-For`. Django trusts
  `X-Forwarded-For` only when the header matches `PROXY_SECRET`.
- An empty value on either side, or two different values, disables client-IP trust. Requests
  are still served, but statistics record `REMOTE_ADDR`: the hosting's internal load-balancer
  address, which changes from request to request, instead of the visitor's IP.
- Only statistics use this IP (see [Access Statistics](statistics.md#client-ip-integrity)).

Each side has one guard:

- **Proxy:** the `Check locals` deploy step above.
- **Backend:** at startup, when `DEBUG` is off and `PROXY_SECRET` is empty, the logger
  `common` logs this `WARNING`:

  ```text
  PROXY_SECRET is not set: X-Forwarded-For is ignored and client IPs fall back to REMOTE_ADDR
  ```

  It appears in the Render logs unless `DJANGO_LOG_LEVEL` is set above `WARNING`.

## Rotating the secret

1. Generate a long random value: `openssl rand -hex 32`. Do not paste it anywhere public.
2. Set it as `$proxySecret` in `locals.php` on the server.
3. Set the same value as `PROXY_SECRET` on the Render backend service.
4. Redeploy the backend so it reads the new value.

Between steps 2 and 4 the two sides disagree, so requests record `REMOTE_ADDR`. This is
harmless since #1737 (sessions are reused across IP changes); only the stored IPs of those
requests are imprecise.

To verify: the backend start has no `PROXY_SECRET is not set` warning, and new statistics
sessions record public client IPs.
