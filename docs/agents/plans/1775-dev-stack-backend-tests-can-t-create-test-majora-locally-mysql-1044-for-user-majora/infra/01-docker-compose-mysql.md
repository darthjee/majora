# MySQL 8.4, healthcheck and root credentials in docker-compose

Make the local test runner behave like CI, and make it bring up its own database.

1. **Pin MySQL 8.4.** Change `majora_mysql`'s image from `mysql:9.3.0` to the latest `mysql:8.4.<patch>` tag on Docker Hub. Use an exact patch tag, not `8.4`. If a matching `cimg/mysql` tag exists, use the same patch as the CI image in step 02.
2. **Healthcheck on `majora_mysql`.** Add one in the base `docker-compose.yml`, with **no `ports:`**:

   ```yaml
   healthcheck:
     test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -uroot -p\"$$MYSQL_ROOT_PASSWORD\" --silent"]
     interval: 2s
     timeout: 5s
     retries: 30
     start_period: 10s
   ```

   Ping over TCP (`-h 127.0.0.1`), not the socket. During first-time init, the official image runs a temporary server with networking disabled, so a socket ping could report healthy before init has finished. `$$` escapes the variable for compose, so the container's own `MYSQL_ROOT_PASSWORD` is used.
3. **`majora_tests` depends on a healthy MySQL and connects as root.** Keep the existing `base_build` dependency and switch `depends_on` to the long form:

   ```yaml
   majora_tests:
     <<: *base
     container_name: majora_tests
     depends_on:
       base_build:
         condition: service_completed_successfully
       majora_mysql:
         condition: service_healthy
     environment:
       - MAJORA_MYSQL_USER=root
   ```

   Check that `service_completed_successfully` fits how `base_build` behaves today (it runs `echo done` and exits). If it doesn't, use `service_started` for `base_build`.

   Don't change `.env` / `.env.dev.sample`, because `majora_app` must keep connecting as `majora`. The `MAJORA_MYSQL_PASSWORD=majora` from `.env` already matches the root password.
4. Leave `majora_app`'s `depends_on` (short form: `majora_mysql` only needs to be started) as it is. `bin/configure_database.sh setup` already waits for the DB.

Verify with `docker-compose config -q`, then do the fresh-volume run from the Notes in [infra.md](../infra.md).

## Files to Change
- `docker-compose.yml`:
  - `majora_mysql`: image → `mysql:8.4.<patch>`, plus the `healthcheck`.
  - `majora_tests`: long-form `depends_on` with `majora_mysql: service_healthy`, and `environment: MAJORA_MYSQL_USER=root`.
