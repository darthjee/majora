# infra Plan: Use navi client and navi server api

Main plan: [plan.md](plan.md)

## Shared contracts

- Every file under `navi/resources/` (owned by `cache`) declares `namespace: $NAVI_NAMEPACE` as an
  unresolved placeholder — you are responsible for giving that variable a real value in every
  environment that reads those files (the CI `warm-up-cache` job, and `docker-compose.yml`'s
  `majora_navi` service).
- The exact set of files `cache` owns under `navi/resources/` — `games.yml`, `npcs.yml`, `pcs.yml`,
  `permissions.yml`, `treasures.yml`, `clients.yml` — must be hardcoded as the `--file` list in
  `scripts/warm_navi_cache.sh`. This is a static list by design (the CLI doesn't understand
  `navi_config.yaml`'s `include:`), so keep it in sync if `cache` ever changes that file set.
- `cache` removes `navi_config.yaml`'s top-level `clients:` block and instead pulls
  `resources/clients.yml` in via `include:` — you don't need to touch `navi_config.yaml` yourself; the
  local `majora_navi` service keeps working against it unchanged, aside from the new env var below.

## Implementation Steps

### Step 1 — `scripts/wake_navi.sh`

New script, retry loop shaped like `scripts/deploy.sh`'s `watch_deployment`: 10 attempts, 15s sleep
between them, `curl`s `$NAVI_URL` and treats any non-`502` response as "awake" (`exit 0`); exits `1`
if still `502` after all attempts.

```bash
#!/bin/bash

MAX_ATTEMPTS=10
SLEEP_SECONDS=15

function wake_navi() {
  for ATTEMPT in $(seq 1 "$MAX_ATTEMPTS"); do
    echo "ATTEMPT $ATTEMPT"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$NAVI_URL")

    if [ "$STATUS" != "502" ]; then
      echo "Navi is awake (status $STATUS)"
      exit 0
    fi

    sleep "$SLEEP_SECONDS"
  done

  echo "Navi did not wake up after $MAX_ATTEMPTS attempts"
  exit 1
}

wake_navi
```

### Step 2 — `scripts/warm_navi_cache.sh`

New script, `ACTION=$1; case $ACTION in ...` dispatch pattern (matching `scripts/deploy.sh`), two
actions so the CI job can run each as its own step for clearer pass/fail logs. Assumes `NAVI_URL`,
`NAVI_API_TOKEN`, and `NAVI_NAMEPACE` are already exported in the environment (see Step 3).

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

function start_engine() {
  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a engine-start \
    -p "{\"targets\":[{\"namespace\":\"$NAVI_NAMEPACE\"}]}"
}

ACTION=$1

case $ACTION in
  "config")
    push_config
    ;;
  "engine-start")
    start_engine
    ;;
  *)
    $ACTION
    ;;
esac
```

`--payload`/`-p` never does `$VAR` substitution (only `--file`/`--json`/`--yaml` do), so
`start_engine` interpolates `$NAVI_NAMEPACE` into the JSON itself via bash rather than relying on the
client — it's the same env var the `config` action's files resolve via their own file-read
substitution.

### Step 3 — Rewire the `warm-up-cache` CI job

Replace the job's current single `navi-hey --config ...` step (using `darthjee/navi-hey:1.5.1` as the
executor) with the client image and a step that first computes `NAVI_NAMEPACE` into `$BASH_ENV` (so it
carries over to the later steps — this repo has no existing computed-env-var precedent to follow, so
this is the standard CircleCI idiom for it), then the two script actions. Keep the job name
`warm-up-cache` and its existing `requires: [release]` / tags-only `filters:` wiring untouched — only
`docker:`/`steps:` change:

```yaml
  warm-up-cache:
    docker:
      - image: darthjee/navi-hey-client:latest
    steps:
      - checkout
      - run:
          name: Set Navi namespace
          command: echo 'export NAVI_NAMEPACE="${MAJORA_NAMESPACE}-${CIRCLE_WORKFLOW_WORKSPACE_ID}"' >> "$BASH_ENV"
      - run:
          name: Push navi config
          command: scripts/warm_navi_cache.sh config
      - run:
          name: Start navi engine
          command: scripts/warm_navi_cache.sh engine-start
```

### Step 4 — Add the `wake-navi` CI job

New job, no `requires:` (runs in parallel from the start of the workflow instead of adding latency in
front of `warm-up-cache`), scoped to the same tags-only filter as `release`/`warm-up-cache`:

```yaml
  wake-navi:
    docker:
      - image: cimg/base:current
    steps:
      - run:
          name: Wake up Navi
          command: scripts/wake_navi.sh
```

Workflow wiring (alongside the other tag-filtered jobs, no `requires:`):

```yaml
      - wake-navi:
          filters: *tags_only
```

### Step 5 — Local dev: `docker-compose.yml` and `.env.dev.sample`

- `docker-compose.yml`: add `- NAVI_NAMEPACE=$NAVI_NAMEPACE` to `majora_navi`'s `environment:` list
  (alongside the existing `MAJORA_PRODUCTION_URL`, `STATISTICS_SKIP_SECRET`, `NAVI_PORT` entries).
- `.env.dev.sample`: add `NAVI_NAMEPACE=default` — matches Navi's own "absent `namespace:` falls back
  to `default`" convention, so a developer who hasn't customized `.env` still gets a working local
  setup.

### Step 6 — Update `.claude/agents/infra.md`

- CI jobs table: change the `warm-up-cache` row's image/purpose to reflect the client-based approach,
  and add a `wake-navi` row.
- Scripts table: add `scripts/warm_navi_cache.sh` and `scripts/wake_navi.sh`.

## Files to Change

- `scripts/wake_navi.sh` — new file
- `scripts/warm_navi_cache.sh` — new file
- `.circleci/config.yml` — rewrite `warm-up-cache` job, add `wake-navi` job + workflow wiring
- `docker-compose.yml` — add `NAVI_NAMEPACE` to `majora_navi`'s `environment:`
- `.env.dev.sample` — add `NAVI_NAMEPACE=default`
- `.claude/agents/infra.md` — update CI jobs and scripts tables

## Notes

- `NAVI_URL`, `NAVI_API_TOKEN`, `MAJORA_NAMESPACE` must be set manually in CircleCI project settings
  (Project Settings → Environment Variables) — same convention as the existing
  `MAJORA_PRODUCTION_URL`. This plan does not (and cannot) set them; flag it to whoever has CircleCI
  project access.
- Don't touch anything under `navi/` — that's `cache`'s scope.
- Full removal of the old `navi-hey`-binary-based `warm-up-cache`, no dual-running/fallback period.
