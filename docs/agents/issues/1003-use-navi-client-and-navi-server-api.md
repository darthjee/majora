# Issue: Use navi client and navi server api

## Description

Majora warms the Tent proxy cache after each production release using [Navi](https://github.com/darthjee/navi). Today this runs the standalone `navi-hey` binary directly inside the CI job (`darthjee/navi-hey:1.5.1` image), reading `navi/navi_config.yaml` and its included `navi/resources/*.yml` files, and spinning up a fresh Navi engine on every single build.

Navi now also ships a persistent server mode plus a `navi-hey-client` npm package/Docker image (`darthjee/navi-hey-client:latest`, client version 0.1.2) that drives an already-deployed, long-running Navi server over its `/api/*` HTTP endpoints. This issue replaces the CI job's standalone-binary approach with driving that persistent server instead: push the warm-up configuration via `POST /api/config` (`-a config`) and trigger the warm-up via `-a engine-start`, using a namespace unique to each CI build so multiple builds/apps sharing the same Navi server don't collide.

See `docs/agents/external/navi-client/cli-usage.md` and `docs/agents/external/navi-client/reference.md` for the client's CLI/API reference, and `docs/agents/external/navi-client/installation.md#docker-image` for the Docker image.

## Problem

- Running `navi-hey` as a standalone binary in CI means every build pays the cost of booting a fresh Navi engine, instead of reusing an already-warm, persistently-deployed server.
- There's no mechanism today to drive the persistent Navi server from CI, nor to keep multiple builds'/apps' resource and client configs from colliding on a server that may be shared.
- The persistent server needs to be woken up before use (it returns `502` while cold-starting), and nothing in CI currently does that.

## Expected Behavior

- A new, non-blocking CI job (`wake-navi`) pings the persistent Navi server (`$NAVI_URL`) early in the workflow to wake it up, retrying while it responds `502`.
- The existing `warm-up-cache` job (still gated on `release`, tags-only) pushes Majora's resource/client config to the persistent server under a per-build-unique namespace, then triggers `engine-start` for that namespace via `navi-hey-client`.
- Local development (`docker-compose up majora_navi`) keeps working unchanged, still running `navi-hey` as an actual local server via `navi_config.yaml`'s `include:` chain.
- The old standalone-binary cache-warming approach is fully removed, not run alongside the new one.

## Solution

### Namespace derivation

`NAVI_NAMEPACE` is derived in CI as `"${MAJORA_NAMESPACE}-${CIRCLE_WORKFLOW_WORKSPACE_ID}"` — reusing `$CIRCLE_WORKFLOW_WORKSPACE_ID` (already used by `bin/deploy_frontend.sh`'s `workspace_temp_dir` for the same "unique-per-build" purpose) instead of introducing a different CircleCI built-in var for the same concept.

### CI Env variables

These must be set manually in CircleCI (Project Settings → Environment Variables) — same convention already documented in `docs/agents/cache-warmer.md` for `MAJORA_PRODUCTION_URL`; never committed to the repo:

- `NAVI_URL` — base URL of the persistent Navi server instance.
- `NAVI_API_TOKEN` — bearer token; must match the `web.api.token` value configured on that Navi server instance.
- `MAJORA_NAMESPACE` — Majora's fixed namespace prefix (e.g. `majora`); the server may be shared across multiple apps/environments, so this is Majora's slice of it.

### Client config extraction & request assembly

Per `docs/agents/external/navi/splitting-configuration.md`, a navi config file can declare `namespace:`, `resources:`, and/or `clients:` all in one file, and files sharing the same `namespace` are merged server-side. This is also the file shape `navi-client`'s `--file`/`--json`/`--yaml` flags read (`configFromFiles` semantics). So instead of trying to merge resources and clients into one hand-built `--payload` (which the CLI keeps mutually exclusive with `--file`, and which also skips env-var substitution entirely — see below), the client config is extracted into its own file of the same shape, in the same namespace, and passed as one more `--file`:

- New file `navi/resources/clients.yml`, extracted from `navi_config.yaml`'s current `clients:` block:
  ```yaml
  namespace: $NAVI_NAMEPACE
  clients:
    default:
      base_url: $MAJORA_PRODUCTION_URL
      timeout: 20000
      headers:
        X-Statistics-Skip-Secret: $STATISTICS_SKIP_SECRET
  ```
- Every existing file under `navi/resources/` (`games.yml`, `npcs.yml`, `pcs.yml`, `permissions.yml`, `treasures.yml`) gets a top-level `namespace: $NAVI_NAMEPACE` line added.
- `navi_config.yaml`'s top-level `clients:` block is removed, and `resources/clients.yml` is added to its `include:` list (alongside the existing five resource files) — this keeps `docker-compose.yml`'s `majora_navi` service (which mounts `./navi/` and runs `navi-hey --config navi_config.yaml` as the actual local-dev server, see "Local dev usage" below) working unchanged, since it still gets the client config through the include chain, just from a different file than before.

`navi_config.yaml`'s `include:` list is a navi-hey-*server* concept (used when running the standalone `navi-hey` binary) — the `navi-client` CLI doesn't read it. It only sends whatever `--file` paths it's given, one request per file. So the set of files to push to the CI client is **hardcoded** in a script (decided over dynamically deriving it from `include:`, to keep things simple/static) rather than inferred — this is a separate mechanism from the `include:` list above, which exists purely for the local `navi-hey` server:

`scripts/warm_navi_cache.sh` (two actions, mirroring the existing `ACTION=$1; case $ACTION in ...` pattern used by `scripts/deploy.sh`, so the CI job can call each as its own step for clearer pass/fail logs):

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

Important nuance driving the `engine-start` payload construction above: `--payload`/`-p` is a raw JSON string — per `reference.md`, `$VAR` substitution only happens for the `--file`/`--json`/`--yaml` file-reading path, never for `--payload`. So `start_engine` can't rely on the client to resolve `$NAVI_NAMEPACE` inside the JSON string; the script interpolates it itself via bash, using the same env var CI exports for the config files.

CI job shape (replacing `warm-up-cache`'s current single `navi-hey --config ...` step), declaring the client image directly as the executor per the Docker-image docs (no `docker run` wrapping needed):

```yaml
  warm-up-cache:
    docker:
      - image: darthjee/navi-hey-client:latest
    steps:
      - checkout
      - run:
          name: Push navi config
          command: scripts/warm_navi_cache.sh config
      - run:
          name: Start navi engine
          command: scripts/warm_navi_cache.sh engine-start
```

### Wake Navi job

No dedicated health-check endpoint is documented for Navi, so the wake-up ping is a plain `curl` against `$NAVI_URL` root — matching the issue's own wording. `scripts/wake_navi.sh` (retry loop shaped like `scripts/deploy.sh`'s `watch_deployment`):

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

CI job — deliberately has no `requires:` (per the issue: "does not depend on anythin nor block anything"), so it runs in parallel from the very start of the workflow alongside the test/build jobs, instead of adding latency to the critical path before `warm-up-cache` actually needs the server awake. Scoped to the same tags-only filter as `release`/`warm-up-cache` (only runs on version-tag builds). If all 10 attempts still return 502, the job fails (`exit 1`) — a visible red X in CI, but harmless since nothing depends on it; revisit if that proves noisy in practice.

```yaml
  wake-navi:
    docker:
      - image: cimg/base:current
    steps:
      - run:
          name: Wake up Navi
          command: scripts/wake_navi.sh
```

```yaml
      - wake-navi:
          filters: *tags_only
```

### Fate of the old cache warmer

Full removal, no dual-running/fallback period. The old `navi-hey` standalone-binary usage footprint in this repo:

- **`.circleci/config.yml`'s `warm-up-cache` job** (`darthjee/navi-hey:1.5.1` + `navi-hey --config navi/navi_config.yaml`) — gets replaced in place. The job **keeps the name `warm-up-cache`**, only its `docker:`/`steps:` change to the client-based version above, so the `requires: [release]` workflow wiring needs no change.
- **`docker-compose.yml`'s `majora_navi` service** (`darthjee/navi-hey:1.5.1`, local dev server on port 3100) — keeps running `navi-hey` as the actual local-dev Navi *server* (a different concern from the CI cache-warming step being replaced), but does need a small env var addition — see "Local dev usage" below.
- **`docs/agents/cache-warmer.md`** and **`.claude/agents/infra.md`** — both currently document the old CI job/image and need rewriting to describe the new `warm-up-cache` (client-based) + `wake-navi` jobs, the new scripts (`scripts/warm_navi_cache.sh`, `scripts/wake_navi.sh`), and `navi/resources/clients.yml`.

### Local dev usage

Developers don't need to set `NAVI_NAMEPACE` themselves — but since *every* `navi/resources/*.yml` file (including the new `clients.yml`) now declares `namespace: $NAVI_NAMEPACE`, and `docker-compose.yml`'s `majora_navi` service only forwards an explicit `environment:` allowlist (`MAJORA_PRODUCTION_URL`, `STATISTICS_SKIP_SECRET`, `NAVI_PORT` — not the full host env) into the container that mounts `./navi/` and runs `navi-hey --config navi_config.yaml`, that allowlist needs `NAVI_NAMEPACE` added too, or the variable resolves empty/unset locally.

Navi's own convention is that an absent `namespace:` falls back to the `default` namespace, so local dev mirrors that explicitly:

- `docker-compose.yml`: add `- NAVI_NAMEPACE=$NAVI_NAMEPACE` to `majora_navi`'s `environment:` list.
- `.env.dev.sample`: add `NAVI_NAMEPACE=default`.

### `engine-stop`

Not needed anywhere in this flow — out of scope.

## Benefits

- Cache warm-up reuses an already-running Navi engine instead of paying cold-start cost on every release build.
- Namespacing lets one persistent Navi server safely host config for multiple builds/apps without collisions.
- Waking the server in a separate, non-blocking job removes cold-start latency from the critical path instead of adding it in front of `warm-up-cache`.
- The set of CircleCI env vars needing manual setup (`NAVI_URL`, `NAVI_API_TOKEN`, `MAJORA_NAMESPACE`) is documented directly on the issue for whoever configures CircleCI.
