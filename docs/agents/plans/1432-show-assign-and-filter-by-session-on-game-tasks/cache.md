# Cache Plan: Show, assign and filter by session on game tasks

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on contract 3 of [plan.md](plan.md#shared-contracts): the new public, paginated `GET /games/:game_slug/sessions.json` (search by `name`).

## Implementation Steps

### Step 1 — Decide on warming `sessions.json`
Following the existing `navi/resources/sessions.yml` conventions for the `past`/`future`/`unscheduled` lists, decide whether the plain paginated `/games/{:slug}/sessions.json` should be warmed. Searches with `name=` are ad-hoc and must not be warmed. If the convention is to warm every public paginated list, add a `game_sessions` entry plus a `paginated_game_sessions` resource, mirroring the `past` one. The tasks endpoints stay unwarmed because they are `@restricted`. Confirm the tasks list still sets `X-Skip-Cache` with the new `session` param.

## Files to Change
- `navi/resources/sessions.yml` — only if warming is added.

## Notes
- If you decide not to warm it, record why in the PR description. No file changes are needed in that case.
