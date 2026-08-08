# Infra Plan: Use per domain cache for all backend endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

None produced or consumed at the code level. Behaviorally, `MAJORA_PRODUCTION_URLS` (this agent's new env var) must list the same set of production domains `proxy`'s per-domain cache now partitions by — any domain missing from the list never gets its cache warmed after deploy (see main plan's "Shared contracts").

## Implementation Steps

### Step 1 — Extend `scripts/warm_navi_cache.sh` to loop over multiple domains

Today `push_config` pushes the resource files once, under whatever `$NAVI_NAMEPACE`/`$MAJORA_PRODUCTION_URL` are already in the environment (set by the CircleCI step before this script runs), and `start_engine` starts warming for that single namespace.

Replace the single-domain flow with a multi-domain one:

- Split the new `$MAJORA_PRODUCTION_URLS` (comma-separated) into an array.
- `push_all_configs`: for each URL, export `NAVI_NAMEPACE="${NAVI_NAMEPACE_BASE}-<index>"` (1-based) and `MAJORA_PRODUCTION_URL="<that URL>"`, then call the existing `push_config` — this relies on `navi-client` substituting `$VAR`-style tokens found in `navi/resources/*.yml` (e.g. `$NAVI_NAMEPACE`, `$MAJORA_PRODUCTION_URL` in `clients.yml`) from the calling shell's environment at push time, the same mechanism today's single-domain flow already depends on.
- `start_engine`: after every domain's config has been pushed, fire a single `engine-start` call whose `targets` array lists every domain's namespace (`{"namespace":"<base>-1"}`, `{"namespace":"<base>-2"}`, ...) — the payload already supports an array; today's code just populates it with one entry.
- `ACTION=$1` dispatch (`config` → push, `engine-start` → start) stays the same; only what each function does internally changes.

Target shape:

```bash
#!/bin/bash

RESOURCE_FILES=(
  navi/resources/games.yml
  navi/resources/npcs.yml
  navi/resources/pcs.yml
  navi/resources/permissions.yml
  navi/resources/treasures.yml
  navi/resources/clients.yml
)

function push_config() {
  FILE_ARGS=()
  for f in "${RESOURCE_FILES[@]}"; do
    FILE_ARGS+=(--file "$f")
  done

  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a config "${FILE_ARGS[@]}"
}

function push_all_configs() {
  IFS=',' read -ra URLS <<< "$MAJORA_PRODUCTION_URLS"
  for i in "${!URLS[@]}"; do
    export NAVI_NAMEPACE="${NAVI_NAMEPACE_BASE}-$((i + 1))"
    export MAJORA_PRODUCTION_URL="${URLS[$i]}"
    push_config
  done
}

function start_engine() {
  IFS=',' read -ra URLS <<< "$MAJORA_PRODUCTION_URLS"
  TARGETS=()
  for i in "${!URLS[@]}"; do
    TARGETS+=("{\"namespace\":\"${NAVI_NAMEPACE_BASE}-$((i + 1))\"}")
  done
  TARGETS_JSON=$(IFS=,; echo "${TARGETS[*]}")

  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a engine-start \
    -p "{\"targets\":[$TARGETS_JSON]}"
}

ACTION=$1

case $ACTION in
  "config")
    push_all_configs
    ;;
  "engine-start")
    start_engine
    ;;
  *)
    $ACTION
    ;;
esac
```

### Step 2 — Rename the CircleCI namespace variable to reflect its new role as a prefix

In `.circleci/config.yml`'s `warm-up-cache` job, the "Set Navi namespace" step currently exports `NAVI_NAMEPACE` directly (the final namespace used for the single domain). Rename it to `NAVI_NAMEPACE_BASE`, since `warm_navi_cache.sh` now derives the final per-domain namespace itself (`${NAVI_NAMEPACE_BASE}-<index>`):

```yaml
  warm-up-cache:
    docker:
      - image: darthjee/navi-hey-client:latest
    steps:
      - checkout
      - run:
          name: Set Navi namespace base
          command: echo 'export NAVI_NAMEPACE_BASE="${MAJORA_NAMESPACE}-${CIRCLE_WORKFLOW_WORKSPACE_ID}"' >> "$BASH_ENV"
      - run:
          name: Push navi config
          command: scripts/warm_navi_cache.sh config
      - run:
          name: Start navi engine
          command: scripts/warm_navi_cache.sh engine-start
```

Only the step name and the exported variable name change; the job's `docker`/image, `requires`, and the two `run` steps calling `warm_navi_cache.sh` stay as-is.

### Step 3 — Add `MAJORA_PRODUCTION_URLS` as a CircleCI project env var (external action)

This isn't a code change — flag it explicitly when the PR is opened. `MAJORA_PRODUCTION_URLS` (comma-separated list of every production domain) must be added to the CircleCI project's environment variables, replacing `MAJORA_PRODUCTION_URL`, **before or alongside** this change deploying. If it's still unset when `warm-up-cache` runs, `push_all_configs`'s loop runs zero iterations and `engine-start` fires with an empty `targets` array — silently warming nothing for every domain.

## Files to Change

- `scripts/warm_navi_cache.sh` — loop `push_config`/`start_engine` over every URL in `$MAJORA_PRODUCTION_URLS`, indexed namespaces, single batched `engine-start`
- `.circleci/config.yml` — rename the `warm-up-cache` job's namespace step/var from `NAVI_NAMEPACE` to `NAVI_NAMEPACE_BASE`

## Notes

- No CI job currently exercises `scripts/warm_navi_cache.sh` or validates `.circleci/config.yml` locally (it only runs live, as a deploy step, on tagged releases) — there's no automated test to add here; validate by tracing through the script logic and/or a manual dry run against a test Navi instance if available.
- **Rollout blocker**: `MAJORA_PRODUCTION_URLS` must exist in CircleCI project settings before the next tagged release after this merges (see Step 3) — call this out explicitly in the PR description.
