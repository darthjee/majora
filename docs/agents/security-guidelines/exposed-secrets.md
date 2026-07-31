# Exposed Secrets

- No credentials, API tokens, secret keys, passwords, or private certificates may appear in source files, Dockerfiles, `docker-compose.yml`, or proxy configuration files.
- `.env` files (`.env`, `.env.*`) must be listed in `.gitignore` and must never be committed.
- Django's `SECRET_KEY` and database credentials must only be read from environment variables (via `os.environ` or `django-environ`) — never hardcoded.
- Any value loaded from the environment in `settings.py` must also be present in `.env.dev.sample` as a placeholder (no real value), so developers know the variable exists.
