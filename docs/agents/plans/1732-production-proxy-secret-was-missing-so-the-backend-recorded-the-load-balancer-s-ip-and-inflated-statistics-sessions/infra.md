# Infra Plan: Production: proxy secret was missing, so the backend recorded the load balancer's IP and inflated statistics sessions

Main plan: [plan.md](plan.md)

## Shared contracts

- `$proxySecret` in `configuration/locals.php` and `PROXY_SECRET` on the backend hold the same
  non-empty value; never commit, print or log it.
- The backend logs (logger `common`, `WARNING`)
  `PROXY_SECRET is not set: X-Forwarded-For is ignored and client IPs fall back to REMOTE_ADDR`
  at startup when `DEBUG` is off and the secret is empty; document it.
- Doc: `docs/agents/production-configuration.md`.

## Implementation Steps

### Step 1 — Fail the proxy deploy when `$proxySecret` is missing or empty

`Setup locals` (`copy_files`) copies the server's existing `locals.php` into the release
directory over SSH, so a key added to `locals.php.sample` never reaches production on its own.
Add a `check_locals` action to `bin/deploy_frontend.sh`:

- `run_check_locals` uses the same `SSH_COMMAND` as the other actions and runs, on the server,
  `php` against `$(remote_temp_dir)/locals.php` (the release copy; `DEPLOY_PATH=configuration/`):
  include the file and exit `1` unless `isset($proxySecret) && is_string($proxySecret) && $proxySecret !== ''`.
- Print only `locals.php: $proxySecret is set` / `locals.php: $proxySecret is missing or empty`
  (to stderr on failure), never the value, and propagate the exit code so the CircleCI step
  fails. Do not use `set -x`.
- Register `"check_locals")` in the `case`.
- In `.circleci/config.yml`, job `copy_proxy_configuration`, add a step right after
  `Setup locals`:
  `name: Check locals`, `command: DEPLOY_PATH=configuration/ bin/deploy_frontend.sh check_locals`.
  A failure stops the workflow before `release`, so the live site keeps its current release.

Production was checked read-only on 2026-11-11: the current `locals.php` defines a non-empty
`$proxySecret` and `php` is available on the server, so the next deploy passes.

### Step 2 — Document the production configuration

Create `docs/agents/production-configuration.md`:

- **Proxy (`configuration/locals.php`, server-side, not in git):** every key from
  `proxy/prod_configuration/locals.php.sample` with a one-line purpose; note that CI copies the
  server's existing file into each release, so a new key must be added on the server by hand
  before the deploy that needs it, and that `Check locals` enforces `$proxySecret`.
- **Backend (Render env vars):** `PROXY_SECRET` and the other env vars `backend/majora_project/settings.py`
  reads (names and purpose only, no values).
- **Pairing rule:** `$proxySecret` and `PROXY_SECRET` must match; an empty value on either side
  disables client-IP trust and statistics record the hosting's internal IP; the backend's
  startup warning (exact text from the shared contract).
- **Rotation:** generate a long random value (`openssl rand -hex 32`), set it in `locals.php`
  on the server and in the Render env var, redeploy the backend; requests between the two
  updates record `REMOTE_ADDR` (harmless after #1737).
- Never put real values, hostnames or paths of the production server in the doc.

Link it from the documentation index in `AGENTS.md` and `docs/agents/index.md` (whichever lists
the `docs/agents/*.md` pages), from `docs/agents/architecture/proxy.md`, and replace the
pairing paragraph in `docs/agents/statistics.md` (around the `PROXY_SECRET` section) with a short
sentence plus a link.

## Files to Change

- `bin/deploy_frontend.sh` — `run_check_locals` + `check_locals` case.
- `.circleci/config.yml` — `Check locals` step in `copy_proxy_configuration`.
- `docs/agents/production-configuration.md` — new.
- `AGENTS.md` / `docs/agents/index.md`, `docs/agents/architecture/proxy.md`,
  `docs/agents/statistics.md` — links.

## CI Checks

- No CI job tests `bin/` scripts. Verify the check locally in the Tent image (it has `php`):
  run the same `php` snippet via `docker-compose run --rm` against three temp files (key
  missing, `''`, a dummy value) and confirm exit codes `1`, `1`, `0` with no value printed.
- Validate the CircleCI config syntax if the CLI is available in a container; otherwise review
  the YAML indentation against the neighbouring steps.

## Notes

- Quote the remote `php -r` carefully (it goes through `ssh` and a remote shell): prefer
  passing the file path as an argument (`php -r '...' -- <path>` reading `$argv[1]`) over
  interpolating it into the PHP code.
- The check only guards the proxy side; the backend side is covered by the backend warning.
- The repo is public: no secret values, real hosts or production paths in commits or the PR.
