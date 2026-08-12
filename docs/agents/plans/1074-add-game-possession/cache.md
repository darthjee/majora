# Cache Plan: Add Game Possession

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the two endpoints to warm from [plan.md](plan.md)'s "Shared contracts" section —
`GET /games/{:slug}/possessions.json` (+ paginated variant) and
`GET /games/{:slug}/possessions/{:id}.json`. Does **not** warm `/possessions/all.json`,
`/possessions/<id>/full.json`, or the `photo_upload.json` POST endpoint — same as the existing
`game_items`/`game_documents` entries deliberately skip their own `/all.json`/`/full.json`
(DM-only, `X-Skip-Cache`) and upload-init routes.

## Implementation Steps

### Step 1 — Add possession entries to `navi/resources/games.yml`

Mirror the existing `game_items`/`paginated_game_items`/`game_item_detail` block
(`navi/resources/games.yml` around the `items`/`items.json` entries) with a new
`game_possessions`/`paginated_game_possessions`/`game_possession_detail` block:

```yaml
  game_possessions:
    - url: /games/{:slug}/possessions.json
      status: 200
      paginated_actions:
        - resource: paginated_game_possessions
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false
          parameters:
            per_page: headers['per_page']

  paginated_game_possessions:
    - url: /games/{:slug}/possessions.json?page={:page}&per_page={:per_page}
      status: 200
      actions:
        - resource: game_possession_detail
          parameters:
            slug: parameters.slug
            id: parsedBody.id

  game_possession_detail:
    - url: /games/{:slug}/possessions/{:id}.json
      status: 200
```

Place it near the existing `items`/`documents` blocks in the same file for readability.

### Step 2 — Verify `X-Skip-Cache` on the restricted variants (read-only check)

Confirm, once the backend agent's views land, that `game_possessions_all` and
`game_possession_detail_full` both set `X-Skip-Cache: true` (same as their `GameItem`
counterparts) — this is the read-only review half of this agent's role per its own description;
report rather than fix if it's missing.

## Files to Change

- `navi/resources/games.yml` — add the `game_possessions`/`paginated_game_possessions`/
  `game_possession_detail` block

## Notes

- No new top-level resource file needed — items/documents are nested inside `games.yml` rather
  than getting their own `navi/resources/*.yml` file, and possessions should follow that same
  precedent rather than introducing a `possessions.yml`.
