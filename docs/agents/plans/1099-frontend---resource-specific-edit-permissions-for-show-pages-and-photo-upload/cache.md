# Cache Plan: Frontend — Resource-specific edit permissions for show pages and photo upload

Main plan: [plan.md](plan.md)

## Shared contracts

[backend.md](backend.md) adds four new entity-agnostic, `?role=`-simulatable GET endpoints:

- `GET /permissions/game_possession.json`
- `GET /permissions/game_item.json`
- `GET /permissions/game_faction.json`
- `GET /permissions/game_document.json`

Same shape (no path params, role query permutations) as the existing `permissions_game`/`permissions_game_pc`/`permissions_game_npc` blocks in `navi/resources/permissions.yml`.

## Implementation Steps

### Step 1 — Add warming blocks for the four new endpoints

`navi/navi_config.yaml` already includes `resources/permissions.yml`, so no new file registration is needed — just extend the existing file. Append four new resource blocks to `navi/resources/permissions.yml`, each mirroring `permissions_game_pc`'s exact five-URL role-permutation shape:

```yaml
  permissions_game_possession:
    - url: /permissions/game_possession.json
      status: 200
    - url: /permissions/game_possession.json?role=player&role=logged
      status: 200
    - url: /permissions/game_possession.json?role=dm&role=player&role=logged
      status: 200
    - url: /permissions/game_possession.json?role=staff&role=player&role=logged
      status: 200
    - url: /permissions/game_possession.json?role=staff&role=dm&role=player&role=logged
      status: 200
```

Repeat for `permissions_game_item` (`/permissions/game_item.json`), `permissions_game_faction` (`/permissions/game_faction.json`), and `permissions_game_document` (`/permissions/game_document.json`).

## Files to Change

- `navi/resources/permissions.yml` — 4 new resource blocks (20 new warmed URLs total)

## Notes

- These endpoints use `AllowAny` + `?role=` simulated-preview, same as every other `/permissions/*.json` route already in this file — no `X-Skip-Cache` review is needed here (that only applies to restricted endpoints gated by real auth, not the simulated-preview `permissions.json` family).
- Land after [backend.md](backend.md)'s routes actually exist — warming a 404 wouldn't fail the CI job outright (depends on `warm_navi_cache.sh`'s own error handling) but would warm nothing useful, so verify against a running backend if landing before the backend PR merges.
