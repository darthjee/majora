# Cache Plan: Add common special items

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the exact public endpoint paths [backend](backend.md) adds — only the regular
(non-restricted) ones get warmed; the `_all`/`full` DM-only variants must be confirmed (read-only
check, per this agent's own remit) to already set `X-Skip-Cache: true` as backend implements
them, not registered for warming here.

## Implementation Steps

### Step 1 — Register the new resource

Add `navi/resources/common_items.yml`, mirroring `navi/resources/possessions.yml` exactly
(nested paginated-list → detail action chain):
```yaml
namespace: $NAVI_NAMEPACE
resources:
  game_common_items:
    - url: /games/{:slug}/common_items.json
      status: 200
      paginated_actions:
        - resource: paginated_game_common_items
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false
          parameters:
            per_page: headers['per_page']

  paginated_game_common_items:
    - url: /games/{:slug}/common_items.json?page={:page}&per_page={:per_page}
      status: 200
      actions:
        - resource: game_common_item_detail
          parameters:
            slug: parameters.slug
            id: parsedBody.id

  game_common_item_detail:
    - url: /games/{:slug}/common_items/{:id}.json
      status: 200
```

### Step 2 — Wire it into the config

`navi/navi_config.yaml` — add `- resources/common_items.yml` alongside the existing
`resources/possessions.yml`/`resources/items.yml` entries.

### Step 3 — Verify restricted endpoints skip the cache

Read-only check (per this agent's standing remit): once [backend](backend.md) lands
`game_common_items_all.py` and `game_common_item_detail_full.py`, confirm both actually set the
`X-Skip-Cache: true` response header, mirroring `game_possessions_all.py`/
`game_possession_detail_full.py`. Report a violation rather than fixing it if either is missing
the header.

## Files to Change

- `navi/resources/common_items.yml` — new
- `navi/navi_config.yaml` — register the new resource file

## Notes

- Only the public `common_items.json`/`common_items/{:id}.json` endpoints are warmed. The
  `/all.json` and `/{:id}/full.json` DM-only variants are intentionally excluded from warming —
  they're low-traffic, permission-gated, and already required to skip the cache entirely.
