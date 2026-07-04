# Infra Plan: Add game sessions

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on the backend endpoints from [plan.md](plan.md):

- `GET /games/<slug>/sessions.json` (paginated)
- `GET /games/<slug>/sessions/<id>.json`

## Implementation Steps

### Step 1 — Add `game_sessions` warm-up chain

In `.circleci/navi_config.yaml`, add three new resources mirroring the existing
`game_pcs`/`paginated_game_pcs`/`pc` chain (since, unlike `game_treasures`, sessions have a
real per-item detail page worth warming):

```yaml
  game_sessions:
    - url: /games/{:slug}/sessions.json
      status: 200
      paginated_actions:
        - resource: paginated_game_sessions
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false

  paginated_game_sessions:
    - url: /games/{:slug}/sessions.json?page={:page}
      status: 200
      actions:
        - resource: session
          parameters:
            id: parsedBody.id
            slug: parsedBody.game_slug

  session:
    - url: /games/{:slug}/sessions/{:id}.json
      status: 200
```

### Step 2 — Wire it into `paginated_games`

Add a `game_sessions` action to the existing per-game action list under `paginated_games`
(alongside `game_detail`, `game_pcs`, `game_npcs`, `game_treasures`):

```yaml
        - resource: game_sessions
          parameters:
            slug: parsedBody.game_slug
```

## Files to Change

- `.circleci/navi_config.yaml` — add `game_sessions`, `paginated_game_sessions`, `session` resources; add the `game_sessions` action under `paginated_games`

## Notes

- No docker-compose/Dockerfile/Makefile changes are needed for this issue — it is purely a new
  Navi warm-up chain for the new endpoints.
- This file should be actioned only after the backend endpoints exist and their exact response
  field names (`id`, `game_slug`) are confirmed, since the `parameters` mappings above read
  directly off the parsed JSON body.
