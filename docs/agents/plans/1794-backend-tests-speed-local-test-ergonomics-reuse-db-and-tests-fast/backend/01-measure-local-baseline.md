# Measure the local baseline

Before any file of this plan is changed, measure a full local run on the unchanged tree, in the
`majora_tests` container:

1. Without coverage: `time docker-compose run --rm majora_tests poetry run pytest`.
2. With coverage: `time docker-compose run --rm majora_tests poetry run pytest --cov`.

Both runs recreate `test_majora` (there is no `addopts` yet), so they include the database
creation. Record the wall-clock time from `time` and pytest's own summary time for each, plus the
number of tests, and note the machine: host OS, CPU, RAM, Docker version and MySQL image
(`mysql:8.4.13`). Also save the `pytest --collect-only -q` output (run in the container) to compare
node IDs after the change. Keep these numbers for step 03; nothing is committed in this step.

## Files to Change

- None (measurement only).
