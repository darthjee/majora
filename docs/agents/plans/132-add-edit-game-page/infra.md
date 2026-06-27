# Infra Plan: Add Edit Game Page

Main plan: [plan.md](plan.md)

## Shared contracts

The backend adds `GET /games/<slug>/access.json` (always 200, `X-Skip-Cache: true`). This endpoint is user-specific (not cacheable) so it does NOT belong in the Navi warm-up chain. No Navi config change is required.

The `PATCH /games/<slug>.json` endpoint is an authenticated mutation — also not appropriate for the Navi warm-up chain.

## Implementation Steps

### Step 1 — Verify Navi config requires no change

Confirm that `.circleci/navi_config.yaml` does not need a new entry for the game access or game PATCH endpoints:
- `/games/<slug>/access.json` sends `X-Skip-Cache: true`, which causes Tent to bypass the cache. Adding it to Navi would warm a per-user response, which is not useful.
- `PATCH /games/<slug>.json` is a mutation endpoint — Navi only warms GET endpoints.

No file changes are needed for infra.

## Files to Change

None.

## Notes

- If a future issue adds a publicly-cacheable game-level endpoint (e.g. a games search or a game feed), that would belong in the Navi config. The current issue does not add such an endpoint.
- The existing `game_detail` resource in `navi_config.yaml` already warms `GET /games/{:slug}.json`. The PATCH upgrade to that view is backward-compatible — the GET response is unchanged.
