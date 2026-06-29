# Infra Plan: Add Game Treasures Page

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes:

- `GET /games/<slug>/treasures.json` — the new endpoint that must be added to the Navi warm-up chain

## Implementation Steps

### Step 1 — Add `game_treasures` resource to Navi config

In `.circleci/navi_config.yaml`, add a `game_treasures` resource and wire it from `paginated_games`. The new endpoint is paginated, so it needs a `paginated_game_treasures` resource similar to `paginated_game_pcs` / `paginated_game_npcs`.

Add under `resources:`:

```yaml
  game_treasures:
    - url: /games/{:slug}/treasures.json
      status: 200
      paginated_actions:
        - resource: paginated_game_treasures
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false

  paginated_game_treasures:
    - url: /games/{:slug}/treasures.json?page={:page}
      status: 200
```

Then extend the `paginated_games` resource to also trigger `game_treasures`:

```yaml
  paginated_games:
    - url: /games.json?page={:page}
      status: 200
      actions:
        - resource: game_detail
          parameters:
            slug: parsedBody.game_slug
        - resource: game_pcs
          parameters:
            slug: parsedBody.game_slug
        - resource: game_npcs
          parameters:
            slug: parsedBody.game_slug
        - resource: game_treasures
          parameters:
            slug: parsedBody.game_slug
```

## Files to Change

- `.circleci/navi_config.yaml` — add `game_treasures` and `paginated_game_treasures` resources; add `game_treasures` action to `paginated_games`

## Notes

- Individual treasure items linked from game treasures do not need to be warmed from this chain — they are already warmed via the `treasure_detail` resource triggered from `paginated_treasures`.
- No Docker or CI pipeline changes needed beyond the Navi config update.
