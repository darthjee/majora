# Frontend Plan: Add edit button when navigating into character page

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes the following endpoints produced by the backend:

| Method | URL | Response |
|--------|-----|----------|
| `GET` | `/games/<slug>/pcs/<id>/access.json` | `{"can_edit": true\|false}`, always HTTP 200 |
| `GET` | `/games/<slug>/npcs/<id>/access.json` | `{"can_edit": true\|false}`, always HTTP 200 |

Both endpoints accept an optional `Authorization: Token <key>` header.
A non-ok response (network error, 404) should be treated as `can_edit: false`.

New `CharacterClient` methods to add:
- `fetchPcAccess(gameSlug, characterId, token)` — GET `/games/<slug>/pcs/<id>/access.json`
- `fetchNpcAccess(gameSlug, characterId, token)` — GET `/games/<slug>/npcs/<id>/access.json`

## Implementation Steps

### Step 1 — Add access methods to `CharacterClient`

In `frontend/assets/js/client/CharacterClient.js`:

Add two public methods alongside the existing `fetchPc`/`fetchPcFull`/`fetchNpc`/`fetchNpcFull`:

```js
fetchPcAccess(gameSlug, characterId, token) {
  return this.#fetchCharacter('pcs', gameSlug, characterId, token, 'access');
}

fetchNpcAccess(gameSlug, characterId, token) {
  return this.#fetchCharacter('npcs', gameSlug, characterId, token, 'access');
}
```

These use the existing private `#fetchCharacter` helper with `suffix = 'access'`, which will build the URL `/games/<slug>/pcs/<id>/access.json`.

### Step 2 — Update `PcCharacterController` to use the access endpoint

In `frontend/assets/js/components/pages/controllers/PcCharacterController.js`:

Refactor `buildEffect()` so that after the character detail is loaded, the controller:
1. Calls `this.characterClient.fetchPcAccess(params.game_slug, params.character_id, token)`.
2. If the response is ok, parses the JSON and overlays `can_edit` onto the character object.
3. If the response is not ok or errors, defaults `can_edit` to `false`.
4. Then calls `loadFullCharacter()` with the updated character (which now has the correct `can_edit`).

The existing `loadFullCharacter()` method already uses `character.can_edit` to decide whether to fetch the full description — this behavior is preserved.

Concrete change in `buildEffect()` — after the `fetchPc` resolves and returns `character`, instead of calling `loadFullCharacter(character, ...)` directly, first fetch access:

```js
.then((character) => {
  return this.characterClient.fetchPcAccess(params.game_slug, params.character_id, token)
    .then((accessResponse) => {
      if (!accessResponse.ok) return character;
      return accessResponse.json().then((access) => ({ ...character, can_edit: access.can_edit }));
    })
    .catch(() => character)
    .then((characterWithAccess) => this.loadFullCharacter(characterWithAccess, params, token, safeSet));
})
```

### Step 3 — Update `NpcCharacterController` identically

Apply the same pattern in `frontend/assets/js/components/pages/controllers/NpcCharacterController.js`, calling `this.characterClient.fetchNpcAccess(...)` instead of `fetchPcAccess`.

### Step 4 — Add `CharacterClient` specs for the new methods

In `frontend/specs/assets/js/client/CharacterClientSpec.js`:

Add `describe('#fetchPcAccess', ...)` and `describe('#fetchNpcAccess', ...)` blocks, each with:
- A test that sends `Authorization: Token <key>` when a token is present and calls the correct URL (`/games/<slug>/pcs/<id>/access.json`).
- A test that omits `Authorization` when no token is given.

### Step 5 — Add controller specs for the access fetch

In `frontend/specs/assets/js/components/pages/controllers/PcCharacterControllerSpec.js`:

Add tests that verify:
- When the access endpoint returns `can_edit: true`, `setCharacter` is called with `can_edit: true` (and `fetchPcFull` is called).
- When the access endpoint returns `can_edit: false`, `setCharacter` is called with `can_edit: false` (and `fetchPcFull` is not called).
- When the access endpoint returns a non-ok response, `can_edit` falls back to whatever the character detail returned (treating it as `false`).
- The access endpoint is always called with the current token.

Apply the same tests to `frontend/specs/assets/js/components/pages/controllers/NpcCharacterControllerSpec.js`.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — add `fetchPcAccess` and `fetchNpcAccess` methods
- `frontend/assets/js/components/pages/controllers/PcCharacterController.js` — call access endpoint after loading character detail
- `frontend/assets/js/components/pages/controllers/NpcCharacterController.js` — same for NPC
- `frontend/specs/assets/js/client/CharacterClientSpec.js` — specs for the two new client methods
- `frontend/specs/assets/js/components/pages/controllers/PcCharacterControllerSpec.js` — specs for access fetch integration
- `frontend/specs/assets/js/components/pages/controllers/NpcCharacterControllerSpec.js` — specs for access fetch integration

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint_fix` (CI job: `frontend-checks`)

## Notes

- The `CharacterHelper` already renders the edit button based on `character.can_edit` — no changes needed there.
- The `CharacterDetailSerializer` already computes `can_edit` and returns it in the detail response — but because Tent caches that response, we override `can_edit` from the uncached access endpoint.
- The access endpoint call is always made (regardless of whether a token is present) so that even a logged-in user whose `can_edit` was falsely cached gets the correct value. A logged-out user's access call simply returns `can_edit: false`.
