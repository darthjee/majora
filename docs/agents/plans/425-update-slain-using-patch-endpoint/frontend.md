# Frontend Plan: Update slain using patch endpoint

Main plan: [plan.md](plan.md)

## Shared contracts

- Send the exact same partial body as today — `{"slain": <bool>}` or `{"public_slain": <bool>}` — but PATCH it
  to `/games/:game_slug/npcs/:id.json` instead of `/games/:game_slug/npcs/:id/slain.json`. The backend agent
  confirms this endpoint already supports partial updates.
- The response body will change shape (full NPC detail payload instead of `{slain, public_slain}`), but
  `SlainConfirmController.handleConfirm` only calls `.then(() => this.onSuccess())` and never reads the
  response — no adjustment needed there.

## Implementation Steps

### Step 1 — Point the slain toggle at the main NPC endpoint

In `frontend/assets/js/client/CharacterClient.js`:
- Replace `setNpcSlain(gameSlug, characterId, token, fields)` so it PATCHes
  `/games/${gameSlug}/npcs/${characterId}.json` instead of the `.../slain.json` path — reuse the existing
  `patchJson` call, just change the URL. Since `patchJson` is generic, consider whether `setNpcSlain` should
  simply delegate to the same underlying call already used for general NPC updates (check for an existing
  `updateNpc`/`updateCharacter`-style method on `CharacterClient` and reuse it if one exists with a compatible
  signature); otherwise keep `setNpcSlain` as a thin wrapper with the corrected URL.
- Update its JSDoc: it no longer targets "the slain endpoint" — note it PATCHes the main NPC endpoint.

### Step 2 — No changes needed in the callers

`SlainConfirmController.handleConfirm` (`frontend/assets/js/components/elements/controllers/SlainConfirmController.js`)
calls `this.client.setNpcSlain(...)` and only uses the resolved promise to trigger `onSuccess()` — its logic
is unaffected by the URL/response-shape change. Same for the pages wiring it up
(`frontend/assets/js/components/pages/GameNpcs.jsx`, `frontend/assets/js/components/pages/NpcCharacter.jsx`) —
no changes expected there.

### Step 3 — Update specs

- `frontend/specs/**/client/CharacterClient/setNpcSlainSpec.js` — update the expected URL from
  `/games/.../npcs/:id/slain.json` to `/games/.../npcs/:id.json`.
- `frontend/specs/**/controllers/SlainConfirmControllerSpec.js` — check whether it asserts on the URL
  (directly or via a mocked `CharacterClient`); update if so, otherwise no change needed.
- Sweep `frontend/specs/**/SlainConfirmModalSpec.js` and any Slain-related helper specs for URL/endpoint
  assumptions tied to the old path; update or leave as-is if they only test UI behavior, not the network call.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — `setNpcSlain` targets the main NPC PATCH endpoint.
- `frontend/specs/.../client/CharacterClient/setNpcSlainSpec.js` — updated expected URL.
- `frontend/specs/.../controllers/SlainConfirmControllerSpec.js` — updated if it asserts on the endpoint URL.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- Confirmed during issue discussion: no UX change — the confirmation modal flow stays exactly as-is, only the
  endpoint being called changes.
- Verify no other frontend code references the literal `/slain.json` path before considering this done.
