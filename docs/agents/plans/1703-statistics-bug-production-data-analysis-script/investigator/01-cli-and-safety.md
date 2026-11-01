# Compose services, command line and target safety

Make the script runnable, and make it refuse any target that is neither local nor the
configured production URL.

## Compose

Add two services to `investigations/statistics-bug/docker-compose.yml`, built like `emulate`
(`python:3.12.7-slim`, `-I -B`, root `.env` optional):

- **`analyse`:** joins the external `majora` network, like `emulate`. It is used for local
  analysis and `--validate`. Defaults: `MAJORA_BASE_URL=http://majora_proxy`, host
  `localhost:3000`.
- **`analyse-prod`:** the default network only, so it does not need the local stack's network.
  It passes `STATISTICS_PROD_URL` through from `.env`, and its entrypoint adds `--production`.

Update the header comment with both run commands.

## Command line (`parse_args` → `Config`)

- `--from` / `--to` (`YYYY-MM-DD`) are **required**. argparse errors out when either is
  missing, and `--from` must not be after `--to`. `--tz` defaults to `UTC`; `--domain` is
  optional.
- `--production`:
  - Without it, every URL must be local, using the same `LOCAL_HOSTS` set as `emulate.py`.
  - With it, the base URL is `STATISTICS_PROD_URL` from the environment, never an argument
    value, and it must be `https`. A missing value is refused.
  - With it, the approval URL is `<prod>/#/account/authorization_requests`.
  - Any other host is refused, and there is no override.
- `--username` / `MAJORA_USERNAME`: the staff user who approves the request.
- `--race-window` (seconds, default 2, must be > 0).
- `--validate <path>`: an `emulate.py` JSON report. It cannot be combined with `--production`;
  the combination is refused.
- `--reports-dir` (default `reports`) and `--dry-run` (validate the configuration only, send
  nothing). Neither prints the production URL; the dry run says only "production URL present:
  yes/no".
- Exit codes match `emulate.py`: 2 refused, 3 authorization or export failed (no report),
  4 network failure. In validation mode, 1 means a mismatch.

## Secrets

- `STATISTICS_SKIP_SECRET` is **optional** and used **only** for local targets. It is never
  sent to production.
- The `Secrets` repr hides every value.

## Files to Change

- `investigations/statistics-bug/docker-compose.yml`: `analyse` and `analyse-prod` services.
- `investigations/statistics-bug/analyse.py` (new): module docstring (purpose, safety rules,
  standard library only), `Config`, `parse_args`, target checks, `Secrets`, `main` skeleton.
