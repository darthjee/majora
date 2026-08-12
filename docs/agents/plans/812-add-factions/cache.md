# Cache Plan: Add factions

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the two endpoints to warm from [plan.md](plan.md)'s "Shared contracts" section —
`GET /games/{:slug}/factions.json` (+ paginated variant) and
`GET /games/{:slug}/factions/{:id}.json`. Does **not** warm the `POST` create endpoint, the
`PATCH` update endpoint, or the `photo_upload.json` POST endpoint — same as every other
resource's mutation endpoints are deliberately left unwarmed.

## Implementation Steps

### Step 1 — Add faction entries to `navi/resources/games.yml`

Mirror the existing `game_items`/`paginated_game_items`/`game_item_detail` block with a new
`game_factions`/`paginated_game_factions`/`game_faction_detail` block:

```yaml
  game_factions:
    - url: /games/{:slug}/factions.json
      status: 200
      paginated_actions:
        - resource: paginated_game_factions
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false
          parameters:
            per_page: headers['per_page']

  paginated_game_factions:
    - url: /games/{:slug}/factions.json?page={:page}&per_page={:per_page}
      status: 200
      actions:
        - resource: game_faction_detail
          parameters:
            slug: parameters.slug
            id: parsedBody.id

  game_faction_detail:
    - url: /games/{:slug}/factions/{:id}.json
      status: 200
```

Place it near the existing `items`/`documents`/`treasures` blocks in the same file for
readability.

### Step 2 — Verify restricted-endpoint header (read-only check)

Faction has no hidden/restricted variant, so there's no `X-Skip-Cache` check to perform here
(unlike `GamePossession`'s `_all`/`_full` endpoints) — confirm this stays true once the backend
agent's views land (i.e. no hidden-inclusive variant was added that would need excluding from
warming).

## Files to Change

- `navi/resources/games.yml` — add the `game_factions`/`paginated_game_factions`/
  `game_faction_detail` block

## Notes

- No new top-level resource file needed — factions nest inside `games.yml` alongside
  items/documents/treasures, same precedent as `possessions`.
