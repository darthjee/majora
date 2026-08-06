# Cache Plan: Add give treasures

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the route `GET games/:game_slug/treasures/:treasure_id.json` (`game_treasure_detail`,
already exists, unchanged — just newly exercised by the frontend's new `GameTreasure.jsx` page)
and is aware of, but must **not** warm, the four new per-character summary endpoints backend
produces (see [plan.md](plan.md)).

## Implementation Steps

### Step 1 — Add `game_treasure_detail` to `navi/resources/games.yml`

The route backing the new `GameTreasure.jsx` page (`games/<slug>/treasures/<treasure_id>.json`)
already exists on the backend but isn't in the navi cache-warming config at all today — confirmed
by grepping `navi/resources/*.yml` for `game_treasure_detail`/`treasures/{:id}`, no match, while
its item equivalent (`game_item_detail`) already is. Add it, mirroring `game_item_detail`'s entry
and the `paginated_game_items → game_item_detail` chaining pattern:

```yaml
  paginated_game_treasures:
    - url: /games/{:slug}/treasures.json?page={:page}&per_page={:per_page}
      status: 200
      actions:
        - resource: game_treasure_detail
          parameters:
            slug: parameters.slug
            id: parsedBody.id

  game_treasure_detail:
    - url: /games/{:slug}/treasures/{:id}.json
      status: 200
```

(the `actions` block is new; the existing `paginated_game_treasures` entry currently has no
`status`-only body to extend — insert the `actions` key into it rather than duplicating the block.)

### Step 2 — Read-only review of the new summary endpoints

Once backend's four new summary views exist, verify (read-only — report, don't fix, per this
agent's own scope) that all four set `X-Skip-Cache: true` (they should, via the `@skip_cache`
decorator on the public variants and the inherent `@restricted` decorator on the `/all.json`
variants — mirroring item summary's own precedent, which is itself intentionally absent from navi
config since per-character-per-treasure data isn't worth cache-warming). Confirm no new
`navi/resources/*.yml` entry is added for these four routes — that would be a regression, not an
improvement, matching why `item`'s summary endpoints were never added either.

## Files to Change

- `navi/resources/games.yml` — add `actions` to `paginated_game_treasures` and a new
  `game_treasure_detail` resource entry

## CI Checks

- None specific to `navi/` in `.circleci/config.yml` beyond whatever general lint/test job already
  covers YAML — no new local command identified.

## Notes

- This is the only genuinely new cache-warming surface from this issue — the four summary
  endpoints are deliberately excluded from warming, same as item's.
