# Infra Plan: Split navi config

Main plan: [plan.md](plan.md)

## Shared contracts

- `cache` moves the Navi entry config to **`navi/navi_config.yaml`** (top-level, sibling to `.circleci/`). Repoint the two existing references at that new path — no other content of the config matters to these changes.

## Implementation Steps

### Step 1 — Update `docker-compose.yml`
In the `majora_navi` service (currently around line 119-128):
- Change the volume mount from `.circleci/:/home/node/app` to `./navi/:/home/node/app`.
- Leave `command: navi-hey --config navi_config.yaml` unchanged — it's already relative to the mounted directory, which now points at `navi/`.

### Step 2 — Update `.circleci/config.yml`
In the `warm-up-cache` job (currently around line 445-452):
- Change `command: navi-hey --config .circleci/navi_config.yaml` to `command: navi-hey --config navi/navi_config.yaml`.

### Step 3 — Sanity check
Confirm no other reference to `.circleci/navi_config.yaml` remains in the repo (e.g. `grep -rn "navi_config" --include=*.yml --include=*.yaml .`).

## Files to Change
- `docker-compose.yml` — `majora_navi` service volume mount updated to `./navi/:/home/node/app`.
- `.circleci/config.yml` — `warm-up-cache` job command updated to `navi-hey --config navi/navi_config.yaml`.

## CI Checks
- `.circleci/`: no dedicated lint/test command for `config.yml` itself beyond CircleCI's own config validation (`circleci config validate`, if the CLI is available locally) (CI job: `warm-up-cache` exercises the changed command directly on every deploy).

## Notes
- Depends on `cache`'s move of the entry file to `navi/navi_config.yaml` (see [cache.md](cache.md)) — both changes are expected to land together in the same PR.
- Do not touch `navi/navi_config.yaml`'s content or `navi/resources/*` — that's `cache`'s scope.
