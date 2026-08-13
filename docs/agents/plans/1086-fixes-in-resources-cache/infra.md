# Infra Plan: Fixes in resources cache

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on `cache`'s file set (see `plan.md`'s "Shared contracts"): the 5 new
`navi/resources/*.yml` files it creates (`items.yml`, `factions.yml`,
`possessions.yml`, `documents.yml`, `sessions.yml`) must all be added to this
agent's `RESOURCE_FILES` array. The existing `games.yml`, `npcs.yml`,
`pcs.yml`, `permissions.yml`, `treasures.yml`, `clients.yml` entries stay as
they are — `cache`'s changes to those files don't rename them.

## Implementation Steps

### Step 1 — Add the 5 new resource files to `scripts/warm_navi_cache.sh`

`RESOURCE_FILES` (lines 3-10) is a hardcoded array, not a glob — unlike
`.claude/scripts/check_cache.sh`, which already discovers files via
`navi/resources/*.yml` and needs no change. Add the 5 new paths:

```bash
RESOURCE_FILES=(
  navi/resources/games.yml
  navi/resources/npcs.yml
  navi/resources/pcs.yml
  navi/resources/permissions.yml
  navi/resources/treasures.yml
  navi/resources/items.yml
  navi/resources/factions.yml
  navi/resources/possessions.yml
  navi/resources/documents.yml
  navi/resources/sessions.yml
  navi/resources/clients.yml
)
```

Without this, the CI `warm-up-cache` job's `config` step (`navi-client -a
config --file ...` per entry) never pushes the new files to the Navi server,
so their resources silently never get warmed even though they're valid,
included config.

## Files to Change

- `scripts/warm_navi_cache.sh` — add the 5 new resource file paths to
  `RESOURCE_FILES`

## CI Checks

- repo root: no dedicated local command found for this script beyond
  `.claude/scripts/check_cache.sh` (covers YAML validity, not this script);
  the real verification only happens when the CircleCI `warm-up-cache` job
  runs the `config` step against a real Navi server on the next release tag.

## Notes

- This is a one-line-per-file addition to a static array — no logic change
  to `push_config`/`push_all_configs`/`start_engine`.
