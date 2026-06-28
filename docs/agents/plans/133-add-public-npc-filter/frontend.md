# Frontend Plan: Add public NPC filter

Main plan: [plan.md](plan.md)

## Shared contracts

### New endpoint consumed

`GET /games/{slug}/npcs/all.json` — returns the same JSON array shape as the existing NPC listing (`[{id, name, avatar_url, game_slug}, ...]`) but includes hidden NPCs. Requires a valid auth token (401 without one, 403 for non-DMs). The frontend should attempt this only when a token is stored, treat any non-2xx response as a silent failure, and fall back to the public listing result.

## Implementation Steps

### Step 1 — Update `GameNpcsController` to fetch `npcs/all.json` in parallel

In `frontend/assets/js/components/pages/controllers/GameNpcsController.js`:

1. Import `AuthStorage` (from `../../../utils/AuthStorage.js`) to read the stored token.
2. In `buildEffect`, after resolving `gameSlug`, fire both fetches in parallel:
   - The existing `client.fetchIndex(/games/${gameSlug}/npcs.json)` (public listing, always fired).
   - If `AuthStorage.getToken()` is non-null, also call a raw `fetch` to `/games/${gameSlug}/npcs/all.json` with `Authorization: Token <token>` header.
3. Use `Promise.allSettled` (or equivalent) so neither failure blocks the other. Prefer the authenticated result when it succeeds (status 200 + parseable body); otherwise fall back to the public listing.
4. Apply the same `safeSet` guards as the existing code.

The constructor signature does not change; the auth fetch is fire-and-prefer internally.

### Step 2 — Update `GameController` to fetch `npcs/all.json` in parallel

In `frontend/assets/js/components/pages/controllers/GameController.js`:

1. In `#fetchNpcsPreview`, after the public fetch, if `AuthStorage.getToken()` is non-null, also fire a request to `/games/${gameSlug}/npcs/all.json?per_page=${MAX_PREVIEW_CHARACTERS}` with an auth token.
2. Prefer the authenticated response if it succeeds; fall back to the public listing on any error or non-2xx.

The constructor signature and existing `GameClient` usage do not change.

### Step 3 — Add a `CharacterClient.fetchNpcsAll` helper (optional but recommended)

To keep raw fetch logic out of controllers, consider adding a `fetchNpcsAll(gameSlug, token, params)` method to `CharacterClient` (or a new `NpcClient`) that returns a raw `Response` promise. Controllers can then call this instead of building the auth header inline.

This is optional; inline auth fetch in the controller is acceptable if it keeps the diff small.

### Step 4 — Write Jasmine specs

- `frontend/spec/components/pages/controllers/GameNpcsController_spec.js` (or equivalent):
  - When no token: only public listing is fetched, result is used as-is.
  - When token present and `all.json` succeeds: authenticated result is used.
  - When token present and `all.json` fails (401/403/network): falls back to public listing.
- `frontend/spec/components/pages/controllers/GameController_spec.js`:
  - Same three scenarios for the NPCs preview section.

## Files to Change

- `frontend/assets/js/components/pages/controllers/GameNpcsController.js` — parallel auth fetch
- `frontend/assets/js/components/pages/controllers/GameController.js` — parallel auth fetch in `#fetchNpcsPreview`
- `frontend/assets/js/client/CharacterClient.js` *(optional)* — `fetchNpcsAll` helper
- `frontend/spec/components/pages/controllers/GameNpcsController_spec.js` — new specs
- `frontend/spec/components/pages/controllers/GameController_spec.js` — new specs for NPC preview

## CI Checks

- `frontend/`: `docker-compose run frontend npm run coverage` (CI job: `jasmine`)

## Notes

- Both controllers should use `Promise.allSettled` rather than `Promise.all` to ensure the public fallback path remains alive even when the auth request fails.
- If the `all.json` request returns 401 or 403, that is expected for logged-out or non-DM users — these should be treated silently and not surface as UI errors.
- The public listing (`npcs.json`) will now exclude hidden NPCs; DMs will only see the full roster via `npcs/all.json`. No UI change is needed — the controller transparently prefers the richer data.
