# Cache Plan: Add Character Possession

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on the backend plan's new character-scoped possession endpoints (see [plan.md](plan.md)'s Shared contracts for the full list): `GET .../possessions.json`, `GET .../possessions/<id>.json`, `GET .../possessions/available.json`, plus their `all`/`available/all` DM-only variants. Only the non-restricted, player-facing `GET` endpoints get warmed — mirror exactly which of `pc_items`/`pc_documents`' endpoints are and aren't in the cache config today.

## Implementation Steps

### Step 1 — Add possession resources to pcs.yml / npcs.yml

In `navi/resources/pcs.yml`, add `pc_possessions`, `paginated_pc_possessions`, and `short_pc_possessions` resources, copying `pc_items`'/`pc_documents`' shape exactly:

```yaml
pc_possessions:
  - url: /games/{:slug}/pcs/{:id}/possessions.json
    status: 200
    actions:
      - resource: paginated_pc_possessions
        parameters:
          slug: parsedBody.game_slug
          id: parsedBody.id

paginated_pc_possessions:
  - url: /games/{:slug}/pcs/{:id}/possessions.json?page={:page}&per_page={:per_page}
    status: 200

short_pc_possessions:
  - url: /games/{:slug}/pcs/{:id}/possessions.json?per_page=5
    status: 200
```

Chain `pc_possessions` and `short_pc_possessions` from the `pc` resource's `actions` list (the same block that already chains to `pc_items`/`short_pc_items`/`pc_documents`/`short_pc_documents`), using the same `parsedBody.game_slug`/`parsedBody.id` parameters.

Repeat identically in `navi/resources/npcs.yml` for `npc_possessions`/`paginated_npc_possessions`/`short_npc_possessions`, chained from the `npc` resource.

### Step 2 — Verify restricted endpoints skip cache

Confirm the new backend `.../possessions/all.json`, `.../possessions/<id>/full.json`, and `.../possessions/available/all.json` views set the `X-Skip-Cache` header (per this repo's convention for DM/owner-only "all" variants — check that the backend plan's `build_possessions_all_view`/`build_possession_detail_full_view`/`build_possessions_available_all_view` follow the same `response['X-Skip-Cache'] = 'true'` line `build_items_all_view` already has). This is a read-only check — report any violation rather than fixing it directly.

## Files to Change

- `navi/resources/pcs.yml` — new `pc_possessions`/`paginated_pc_possessions`/`short_pc_possessions` resources + chaining
- `navi/resources/npcs.yml` — new `npc_possessions`/`paginated_npc_possessions`/`short_npc_possessions` resources + chaining

## Notes

- No changes needed to `navi/resources/games.yml` — the game-level possession cache entries already exist from #1074.
- No `game_pc_possession`/`game_npc_possession` catalog resource needed in `navi/navi_config.yaml` beyond what's already wired for `pc`/`npc` (per [docs/agents/cache-warmer.md](../../cache-warmer.md)), assuming possession follows the exact same warming shape as item/document.
