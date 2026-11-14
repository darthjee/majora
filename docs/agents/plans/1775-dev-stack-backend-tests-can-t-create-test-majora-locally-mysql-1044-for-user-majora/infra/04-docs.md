# Documentation

Keep the docs in line with the new setup, and tell existing developers what to do once.

- **`AGENTS.md`**, development section (near the `make setup` paragraph): add a short note. It should say:
  - Since #1775 the dev MySQL is 8.4 (down from 9.3).
  - MySQL 8.4 can't open a `docker_volumes/mysql_data` created by 9.3, so stop the stack, delete `docker_volumes/mysql_data`, and run `make setup` again.
  - `majora_tests` now starts and waits for `majora_mysql` itself and connects as root, matching CI.
- **`.claude/agents/infra.md`**:
  - Services table: change the `majora_mysql` image from `mysql:9.3.0` to the pinned 8.4 tag.
  - CI jobs table: replace the `pytest` row (`cimg/mysql:8.0`) with the real backend jobs (`pytest_views_characters`, `pytest_views_rest`, `pytest_all`) on the pinned `cimg/mysql:8.4` tag.
  - "Host ports are opt-in": mention that `check_infra.sh` now enforces no `ports:` in the base `docker-compose.yml`.
  - Briefly note that `majora_tests` overrides `MAJORA_MYSQL_USER=root` and depends on `majora_mysql` being `service_healthy`, and that dev, CI and production all run MySQL 8.4.

## Files to Change
- `AGENTS.md`: the one-off data-dir wipe note and the test runner's DB behaviour.
- `.claude/agents/infra.md`: MySQL versions, CI job rows, the no-ports guard and the `majora_tests` DB settings.
