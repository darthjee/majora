# Crawler Plan: Dev stack: don't publish host ports when running tests/validation

Main plan: [plan.md](plan.md)

## Shared contracts

- `crawler_navi_web`'s host port `127.0.0.1:3110` now lives in `docker-compose.ports.yml` (provided by infra). Reaching it from the host requires `docker-compose -f docker-compose.yml -f docker-compose.ports.yml up crawler_navi_web`.

## Implementation Steps

### Step 1 — Update the Enqueue UI run command

In `crawler/RUNNING.md` (interactive Enqueue UI, step 2), replace `docker compose up crawler_navi_web` with the opt-in form `docker compose -f docker-compose.yml -f docker-compose.ports.yml up crawler_navi_web`. Note that without the ports file the UI is not reachable on `127.0.0.1:3110`.

## Files to Change
- `crawler/RUNNING.md` — run command includes the ports file.

## CI Checks
- Markdown: `docker-compose run --rm markdownlint` (CI job: `markdownlint`)

## Notes
- Docs only.
