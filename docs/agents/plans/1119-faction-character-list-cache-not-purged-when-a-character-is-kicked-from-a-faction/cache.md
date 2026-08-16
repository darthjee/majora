# Cache Plan: Faction Character List Cache Not Purged When A Character Is Kicked From A Faction

Main plan: [plan.md](plan.md)

## Shared contracts

Verifies against the new endpoint shape (see [plan.md](plan.md#shared-contracts)) — the four POST
remove/remove-all routes gain a `:faction_id` path segment.

## Implementation Steps

### Step 1 — Confirm the Navi warm-up config is unaffected

The remove/remove-all endpoints are POST mutation routes; `docs/agents/cache-warmer.md` documents
Navi as warming GET endpoints only. Confirm `navi/navi_config.yaml` and `navi/resources/*.yml` have
no entries referencing `factions/remove.json`/`factions/remove/all.json` (expected: none). No
config change should be needed — this step is a verification, not an edit.

### Step 2 — Confirm `/games/:game_slug/factions/:faction_id/characters.json` warm-up is unaffected

This GET endpoint's own URL shape does not change under this issue — only the unrelated POST
trigger routes gain a path segment. Confirm its existing Navi entry (if any) in
`navi/navi_config.yaml`/`navi/resources/*.yml` still matches correctly and needs no update.

## Files to Change

None expected. If Step 1 or Step 2 surfaces a stale reference, update the relevant
`navi/navi_config.yaml`/`navi/resources/*.yml` entry and note the change here instead of leaving
this section empty.

## Notes

- This is a verification-only task per the issue's own scope note ("re-verify the Navi warm-up
  config/docs ... are unaffected or updated"). Report back if anything unexpected is found rather
  than assuming "no change needed" without checking.
