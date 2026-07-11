# Frontend Plan: Move npc update to `PATCH full.json`

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on: backend's `PATCH /games/:game_slug/npcs/:id/full.json` and
`PATCH /games/:game_slug/pcs/:id/full.json` accepting the same fields the plain endpoint
accepts today (`name`, `role`, `public_description`, `private_description`, `hidden`, `money`,
`allegiance`, `public_allegiance`, `slain`, `public_slain`, `links`), and returning the same
`CharacterFullSerializer` shape (200) / 401 / 403 / 400 `{"errors": {...}}` the frontend
already handles. No frontend response-handling logic needs to change — only the request URL.

## Implementation Steps

### Step 1 — Repoint `CharacterClient#updateCharacter` at `full.json`

In `frontend/assets/js/client/CharacterClient.js`, change `updateCharacter` (currently
`this.patchJson(\`/games/${gameSlug}/${characterKind}/${characterId}.json\`, ...)`, around
line 77) to target
`` `/games/${gameSlug}/${characterKind}/${characterId}/full.json` `` instead, for both
`characterKind` values (`'pcs'` and `'npcs'`) — this single method is the shared call site for
the edit-page submit (`BaseCharacterEditController#handleSubmit`) and the NPC slain toggle
(`setNpcSlain`), so no other production file needs to change. Update the method's JSDoc to
describe the new endpoint.

### Step 2 — Update specs

- `frontend/specs/assets/js/client/CharacterClient/updateCharacterSpec.js` — change both
  expected URLs (`for a PC` and `for an NPC` cases) from `.../pcs/2.json` /
  `.../npcs/2.json` to `.../pcs/2/full.json` / `.../npcs/2/full.json`.
- `frontend/specs/assets/js/client/CharacterClient/setNpcSlainSpec.js` — change the expected
  URL from `/games/demo/npcs/2.json` to `/games/demo/npcs/2/full.json`.
- Search the rest of `frontend/specs/` for any other spec asserting on the plain
  `.../pcs/:id.json` or `.../npcs/:id.json` PATCH URL (e.g. anything under
  `BaseCharacterEditController` or `SlainConfirmController` specs that stubs fetch and checks
  the called URL rather than just mocking `characterClient`) and update those too, so no spec
  is silently exercising the wrong path.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — `updateCharacter` now targets `full.json`.
- `frontend/specs/assets/js/client/CharacterClient/updateCharacterSpec.js` — updated URLs.
- `frontend/specs/assets/js/client/CharacterClient/setNpcSlainSpec.js` — updated URL.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- `BaseCharacterEditController.js` and `SlainConfirmController.js` need no changes themselves
  — they call `characterClient.updateCharacter(...)` / `client.setNpcSlain(...)`, and the URL
  change is fully internal to `CharacterClient`.
- Coordinate with backend: don't merge this ahead of the backend PATCH support landing on
  `full.json`, or NPC/PC edits and the slain toggle will break in whatever environment picks up
  the frontend change first.
