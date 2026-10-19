# Exposed Secrets

- No credentials, API tokens, secret keys, passwords, or private certificates may appear in source files, Dockerfiles, `docker-compose.yml`, or proxy configuration files.
- `.env` files (`.env`, `.env.*`) must be listed in `.gitignore` and must never be committed.
- Django's `SECRET_KEY` and database credentials must only be read from environment variables (via `os.environ` or `django-environ`) — never hardcoded.
- Any value loaded from the environment in `settings.py` must also be present in `.env.dev.sample` as a placeholder (no real value), so developers know the variable exists.
- Scoped API token secrets (`mjr_...`) are stored only as a SHA-256 hash, never logged (neither
  the `Authorization` header nor the create response body) and never kept in historical records
  or the Django admin. The `mjr_` tag lets secret scanners spot a leaked token. See
  [ApiToken](../access-control/api-token.md#secret-handling-logging-and-audit).
- `NPM_TOKEN` (the `majora-client` release token) lives only in the CircleCI project
  environment and is written to `~/.npmrc` inside the release job, never committed.
- Local `MAJORA_TOKEN` values for the `majora_client` service come from the host environment or
  `.env` and are never committed.

