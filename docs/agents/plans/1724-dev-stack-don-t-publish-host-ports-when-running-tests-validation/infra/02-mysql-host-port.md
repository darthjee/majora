# Decouple the MySQL host port

Today `MAJORA_MYSQL_PORT` does two jobs. It sets the host-side mapping, and `backend/majora_project/settings.py` reads it as the port to connect on (`majora_tests` gets it from `.env` with no override). Changing it to dodge a host clash would break in-network connections.

- Add `MAJORA_MYSQL_HOST_PORT=3306` to `.env.dev.sample` under the MySQL settings. Add a comment saying it is only the host-side port (opt-in ports file) and that `MAJORA_MYSQL_PORT` must stay `3306`, the in-network port.
- Use it only in `docker-compose.ports.yml`, with a `:-3306` default so existing `.env` files keep working.
- Leave `MAJORA_MYSQL_PORT` and `settings.py` unchanged.

## Files to Change
- `.env.dev.sample` — add `MAJORA_MYSQL_HOST_PORT` with an explanatory comment.
- `docker-compose.ports.yml` — reference `${MAJORA_MYSQL_HOST_PORT:-3306}` (done together with step 01).
