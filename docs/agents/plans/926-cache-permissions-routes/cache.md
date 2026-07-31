# Cache Plan: Cache permissions routes

Main plan: [plan.md](plan.md)

## Shared contracts

Warm the 4 new routes from [plan.md](plan.md#shared-contracts), each with the 5 role
combinations listed there, role params ordered per `AccessStoreRoles.ROLE_FLAGS`. Do not warm the
old per-entity routes — they're being removed by `backend`.

## Context

`.circleci/navi_config.yaml` currently has no `permissions`/`access` entries at all (the
`permissions.json` endpoints were never warmable before, since each entity instance was a
separate cache key). The new routes are static, unparameterized URLs — no chaining or
`parsedBody`/`parameters.*` plumbing needed, unlike most of the existing chained resources (see
`docs/agents/cache-warmer.md`'s "Maintaining this configuration").

## Implementation Steps

### Step 1 — Add warm-up entries

Under `resources:` in `.circleci/navi_config.yaml`, add one resource group per new endpoint
(`permissions_game`, `permissions_treasure`, `permissions_game_pc`, `permissions_game_npc`, or
similar naming consistent with existing resource keys), each with 5 static `url` entries — one
per role combination from [plan.md](plan.md#shared-contracts):

```yaml
permissions_game:
  - url: /permissions/game.json
    status: 200
  - url: /permissions/game.json?role=player&role=logged
    status: 200
  - url: /permissions/game.json?role=dm&role=player&role=logged
    status: 200
  - url: /permissions/game.json?role=staff&role=player&role=logged
    status: 200
  - url: /permissions/game.json?role=staff&role=dm&role=player&role=logged
    status: 200
```

Repeat for `permissions/treasure.json`, `permissions/game_pc.json`, `permissions/game_npc.json`
with the same 5 role-query variants each (20 total new `url` entries across the 4 resources).

### Step 2 — Wire into the top-level chain (if applicable)

Check whether these should be listed as standalone top-level resources (most likely, since they
no longer depend on any `parsedBody`/`parameters.*` value from `/games.json` or similar) versus
chained `actions` off an existing resource. Given they're now entity-agnostic, standalone entries
are the natural fit — do not chain them off `game_detail`/`treasure_detail`/etc., since that would
reintroduce a per-entity-instance request pattern this issue is explicitly removing.

### Step 3 — Update the cache-warmer doc

Update `docs/agents/cache-warmer.md` if its prose enumerates the resource families covered (check
whether it needs a mention of the new `permissions_*` resources, consistent with how other
resource groups are described there).

## Files to Change

- `.circleci/navi_config.yaml` — add the 4 new resource groups (20 `url` entries total)
- `docs/agents/cache-warmer.md` — mention the new resources if the doc enumerates resource
  families

## Notes

- Wait for `backend` to land the new route paths/names before finalizing entity-segment naming
  here (`game`/`treasure`/`game_pc`/`game_npc`) — keep this in sync with whatever the backend
  plan actually ships.
- No CI job runs `navi_config.yaml` locally as a check (the `warm-up-cache` job only runs against
  production after a release tag) — validate by eye against the format of existing entries, and
  optionally via `docker-compose up majora_navi` per `docs/agents/cache-warmer.md`'s "Local
  testing" section.
