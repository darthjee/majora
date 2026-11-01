# Move host ports into an opt-in ports file

1. Remove every `ports:` block from the root `docker-compose.yml`. Today these are on `majora_mysql`, `majora_app`, `majora_prod_app`, `majora_fe`, `majora_proxy`, `majora_navi`, `majora_phpmyadmin` and `crawler_navi_web`.
2. Create `docker-compose.ports.yml` at the repo root. It redeclares only those services with their `ports:`, every one bound to `127.0.0.1`:

| Service | Mapping |
| --- | --- |
| `majora_mysql` | `127.0.0.1:${MAJORA_MYSQL_HOST_PORT:-3306}:3306` |
| `majora_app` | `127.0.0.1:3030:8080` |
| `majora_prod_app` | `127.0.0.1:3030:8080` |
| `majora_fe` | `127.0.0.1:3010:8080` |
| `majora_proxy` | `127.0.0.1:3000:80` |
| `majora_navi` | `127.0.0.1:3100:3000` |
| `majora_phpmyadmin` | `127.0.0.1:3050:80` |
| `crawler_navi_web` | `127.0.0.1:3110:3000` |

3. Add a header comment to `docker-compose.ports.yml`. It should explain that the file is opt-in (`-f docker-compose.yml -f docker-compose.ports.yml`) and why: tests and validation must not bind host ports (#1724).
4. Add a short comment in `docker-compose.yml` pointing to the ports file.

Use a name docker-compose does **not** auto-load (not `docker-compose.override.yml`), so that bare commands, including the ones agents run, never publish ports.

## Files to Change

- `docker-compose.yml` — drop all `ports:` blocks; add a pointer comment.
- `docker-compose.ports.yml` — new; holds every host-port mapping, bound to `127.0.0.1`.
