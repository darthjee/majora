# cache Plan: Use navi client and navi server api

Main plan: [plan.md](plan.md)

## Shared contracts

- Declare `namespace: $NAVI_NAMEPACE` (a literal, unresolved placeholder — `infra` is responsible for
  giving it a value in every environment) as a top-level key in every file under `navi/resources/`,
  including the new `clients.yml`.
- The exact set of files you own under `navi/resources/` — `games.yml`, `npcs.yml`, `pcs.yml`,
  `permissions.yml`, `treasures.yml`, `clients.yml` — is hardcoded by `infra`'s
  `scripts/warm_navi_cache.sh` as the list of `--file` arguments pushed to the Navi server. If this set
  changes, flag it so `infra` can update that script's `RESOURCE_FILES` array.
- `navi_config.yaml`'s `include:` list is what keeps `docker-compose.yml`'s `majora_navi` service
  (owned by `infra`) working locally — it still runs the standalone `navi-hey` server against
  `navi_config.yaml`, so `resources/clients.yml` must be reachable through `include:`, not just handed
  to the CI client script directly.

## Implementation Steps

### Step 1 — Namespace the existing resource files

Add a top-level `namespace: $NAVI_NAMEPACE` line to each of the five existing files under
`navi/resources/`: `games.yml`, `npcs.yml`, `pcs.yml`, `permissions.yml`, `treasures.yml`. This puts
every resource they declare into the `$NAVI_NAMEPACE` namespace instead of the implicit `default` one.

### Step 2 — Extract client config into its own namespaced file

Create `navi/resources/clients.yml`, extracting the current `clients:` block from `navi_config.yaml`
and namespacing it the same way:

```yaml
namespace: $NAVI_NAMEPACE
clients:
  default:
    base_url: $MAJORA_PRODUCTION_URL
    timeout: 20000
    headers:
      X-Statistics-Skip-Secret: $STATISTICS_SKIP_SECRET
```

Copy the current values verbatim from `navi_config.yaml`'s existing `clients:` block — don't change
`base_url`/`timeout`/headers, only add the `namespace:` key and relocate it into this new file.

### Step 3 — Update `navi_config.yaml`

- Remove the top-level `clients:` block (now fully superseded by `resources/clients.yml`).
- Add `resources/clients.yml` to the existing top-level `include:` list, alongside the five resource
  files already there.

Before removing the old block, double-check per
[docs/agents/external/navi/splitting-configuration.md](../../external/navi/splitting-configuration.md)
that no other included file already declares a `clients` entry under the same namespace — declaring
the same name twice within one namespace is a Navi configuration error.

### Step 4 — Rewrite `docs/agents/cache-warmer.md`

Update the doc to describe the new CI flow instead of the old one:

- The `warm-up-cache` job now runs against a persistent, already-deployed Navi server via
  `navi-hey-client` (image `darthjee/navi-hey-client:latest`) instead of the standalone
  `darthjee/navi-hey:1.5.1` binary — link to `infra`'s new `scripts/warm_navi_cache.sh` for the exact
  actions (`config`, `engine-start`).
- A new, unblocking `wake-navi` CI job pings the server awake beforehand (`infra`'s
  `scripts/wake_navi.sh`).
- Every file under `navi/resources/` (including the new `clients.yml`) now declares
  `namespace: $NAVI_NAMEPACE`, resolved per-environment (CI: derived from `$MAJORA_NAMESPACE` +
  `$CIRCLE_WORKFLOW_WORKSPACE_ID`; local dev: `default`).
- The "Local testing (Docker Compose)" section is otherwise unaffected — `docker-compose up majora_navi`
  still runs the standalone `navi-hey` server against `navi_config.yaml`'s `include:` chain, which now
  also pulls in `resources/clients.yml`.
- The "Maintaining this configuration" section (rules for adding new endpoints) is unchanged and stays
  as-is.

## Files to Change

- `navi/resources/games.yml` — add `namespace: $NAVI_NAMEPACE`
- `navi/resources/npcs.yml` — add `namespace: $NAVI_NAMEPACE`
- `navi/resources/pcs.yml` — add `namespace: $NAVI_NAMEPACE`
- `navi/resources/permissions.yml` — add `namespace: $NAVI_NAMEPACE`
- `navi/resources/treasures.yml` — add `namespace: $NAVI_NAMEPACE`
- `navi/resources/clients.yml` — new file, extracted client config
- `navi/navi_config.yaml` — remove top-level `clients:` block, add `resources/clients.yml` to
  `include:`
- `docs/agents/cache-warmer.md` — rewrite CI section, note namespace mechanism

## Notes

- Don't touch `.circleci/config.yml`, `docker-compose.yml`, or anything under `scripts/` — those are
  `infra`'s files.
- The CI env vars that ultimately resolve `$NAVI_NAMEPACE`/`$MAJORA_PRODUCTION_URL`/
  `$STATISTICS_SKIP_SECRET` are not this agent's concern to set up — only to reference correctly in the
  YAML.
