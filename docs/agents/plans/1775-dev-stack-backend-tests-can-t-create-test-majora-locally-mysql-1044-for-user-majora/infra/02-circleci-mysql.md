# MySQL 8.4 in CircleCI

Run CI against the same MySQL version as dev and production.

- Change the `mysql` service image from `cimg/mysql:8.0` to an exact `cimg/mysql:8.4.<patch>` tag in all three backend jobs: `pytest_views_characters`, `pytest_views_rest` and `pytest_all` (around lines 162, 195 and 228).
- Check which tags exist on Docker Hub (`cimg/mysql`), and prefer the same patch as `docker-compose.yml`.
- Leave the job environment (`MAJORA_MYSQL_USER: root`, etc.) unchanged.
- Confirm the three jobs pass on the PR. This also confirms the backend connects under 8.4's default `caching_sha2_password` auth.

## Files to Change
- `.circleci/config.yml`: `cimg/mysql:8.0` → `cimg/mysql:8.4.<patch>` in the three backend test jobs.
