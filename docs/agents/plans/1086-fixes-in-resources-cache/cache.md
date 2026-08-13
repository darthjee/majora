# Cache Plan: Fixes in resources cache

Main plan: [plan.md](plan.md)

## Shared contracts

This agent produces the final `navi/resources/*.yml` file set that `infra`'s
`scripts/warm_navi_cache.sh` must push (see `plan.md`'s "Shared contracts"
for the exact filenames and which resources land in each). Land this
agent's changes first (or in the same PR) since `infra`'s script update is
meaningless without the files existing.

## Implementation Steps

### Step 1 — Move PCs/NPCs/treasures resources out of `games.yml`

In `navi/resources/games.yml`, remove `game_pcs`, `paginated_game_pcs`,
`short_game_pcs`, `game_npcs`, `paginated_game_npcs`, `short_game_npcs`,
`game_treasures`, `paginated_game_treasures`, `game_treasure_detail` and
append them (unchanged) to the end of `navi/resources/pcs.yml`,
`navi/resources/npcs.yml`, and `navi/resources/treasures.yml` respectively.
`game_detail`'s existing `actions` referencing `short_game_pcs`/
`short_game_npcs` in `games.yml` need no change — cross-file references
within the same `$NAVI_NAMEPACE` namespace need no explicit `namespace:` key.

### Step 2 — Create `items.yml`, `factions.yml`, `possessions.yml`

Create these three new files under `navi/resources/`, each starting with
`namespace: $NAVI_NAMEPACE` and a `resources:` key, moving the corresponding
`game_items`/`game_factions`/`game_possessions` chains (and their
`paginated_*`/`*_detail` resources) out of `games.yml` verbatim. Use
`navi/resources/treasures.yml` as the structural template (a single
`list -> paginated -> detail` chain).

### Step 3 — Create `documents.yml`

Create `navi/resources/documents.yml` (same `namespace:` header), moving
`game_documents`, `paginated_game_documents`, `game_document_details`,
`game_document_files`, `game_document_photos`, `short_game_document_files`,
and `short_game_document_photos` out of `games.yml` verbatim — this is the
one resource family with a nested detail fan-out (`game_document_details`
triggers 4 further actions), so double-check indentation carries over
correctly.

### Step 4 — Create `sessions.yml`

Create `navi/resources/sessions.yml` (same `namespace:` header), moving
`game_sessions` (its 3 `paginated_actions` entries for past/future/
unscheduled) and the resulting `paginated_game_sessions_past`,
`paginated_game_sessions_future`, `paginated_game_sessions_unscheduled`, and
`session` resources out of `games.yml` verbatim.

### Step 5 — Trim `games.yml` down

After steps 1-4, `navi/resources/games.yml` should contain only `games`,
`paginated_games`, `game_detail`, `game_photos`, `paginated_game_photos` —
verify `game_detail`'s `actions` list (pointing at `short_game_pcs`/
`short_game_npcs`) and `paginated_games`' fan-out into every moved resource
still reference the right resource names (unchanged names, just relocated).

### Step 6 — Update `navi/navi_config.yaml`

Add `resources/items.yml`, `resources/factions.yml`,
`resources/possessions.yml`, `resources/documents.yml`,
`resources/sessions.yml` to the `include:` list, alongside the existing 6
entries.

### Step 7 — Update `docs/agents/cache-warmer.md`

Update the "Configuration" section's bullet list (currently describing 6
files) to describe the new 11-file layout — one bullet per file, matching
the breakdown in `plan.md`'s "Shared contracts" section. Update the
paragraph below the list that currently says "games.yml — chain down through
… PCs, NPCs, treasures, items, factions, possessions, photos, documents, and
sessions" to reflect that only `games`/`game_photos` remain there, with the
rest fanning out into their own files.

## Files to Change

- `navi/resources/games.yml` — trim to `games`/`game_photos` chain only
- `navi/resources/pcs.yml` — append `game_pcs`/`paginated_game_pcs`/`short_game_pcs`
- `navi/resources/npcs.yml` — append `game_npcs`/`paginated_game_npcs`/`short_game_npcs`
- `navi/resources/treasures.yml` — append `game_treasures`/`paginated_game_treasures`/`game_treasure_detail`
- `navi/resources/items.yml` (new) — `game_items` chain
- `navi/resources/factions.yml` (new) — `game_factions` chain
- `navi/resources/possessions.yml` (new) — `game_possessions` chain
- `navi/resources/documents.yml` (new) — `game_documents`/`game_document_*` chain
- `navi/resources/sessions.yml` (new) — `game_sessions`/`session` chain
- `navi/navi_config.yaml` — add 5 new files to `include:`
- `docs/agents/cache-warmer.md` — update file-layout description

## CI Checks

- `navi/`: `.claude/scripts/check_cache.sh` (validates every
  `navi/resources/*.yml` file plus `navi/navi_config.yaml` parse as YAML —
  not wired into a named CircleCI job, but the standard local smoke test
  before pushing changes to these files)

## Notes

- No resource is renamed, added, or removed — this is purely a file-location
  change, so the warmed URL set and pagination behavior must be identical
  before and after.
- Coordinate with `infra`'s plan: its `scripts/warm_navi_cache.sh` change
  only makes sense once these files exist.
