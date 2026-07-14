# Frontend Plan: Split photos from character in the endpoints

Main plan: [plan.md](plan.md)

## Shared contracts

- The PC/NPC show (`.json`) and full (`full.json`) responses will stop including a `photos` field (backend agent's change). Photo data must now come from `GET /games/:game_slug/{pcs,npcs}/:id/photos.json`, which already exists and already returns a paginated list of `{id, path}` objects with `page`/`pages`/`per_page` headers — same shape the existing photo-gallery page (`BaseCharacterPhotosController.js`) already consumes.
- Request `per_page=6` on this new fetch (matching `MAX_PREVIEW_PHOTOS` from `frontend/assets/js/components/common/characterPreviewConstants.js`), so the preview grid gets a right-sized response instead of over-fetching and slicing client-side.

## Context

Both `CharacterHelper.jsx` (show page) and `CharacterPhotosPreview.jsx`/`CharacterPhotosPreviewHelper.jsx` (preview grid) already read `character.photos ?? []` and render it — they need **no changes**, since they don't care where `photos` came from, only that it's present on the character object once state is set. The edit page (`shared/CharacterEdit.jsx`) never renders `CharacterPhotosPreview` at all — it only uses `profile_photo_path`, so it doesn't need `photos` for rendering. However, `BaseCharacterEditController.js` composes the exact same `CharacterController`/`loadCharacter` used by the show page (see its constructor building `this.loadController = new loadControllerClass(...)`), so whatever fetch is added to `loadCharacter` runs on the edit page too. This already happens today for `treasures` (fetched by `fetchAndMergeTreasures` even though the edit page doesn't render a treasures preview either) — follow that same precedent rather than special-casing edit vs. show.

## Implementation Steps

### Step 1 — Add a photos-fetch method to `CharacterClient`

In `frontend/assets/js/client/CharacterClient.js`, add a method that fetches a page of a character's photos, parameterized by `characterKind` like the other methods in this file (e.g. `fetchCharacterTreasures`), but able to pass `per_page` as a query param — follow the `URLSearchParams` pattern already used in `fetchTreasuresPage` (lines 108-119) rather than the private `#fetchCharacter` helper (which doesn't support query params). Suggested signature: `fetchCharacterPhotos(characterKind, gameSlug, characterId, token, perPage = 6)`, hitting `/games/${gameSlug}/${characterKind}/${characterId}/photos.json?per_page=${perPage}`. Match the existing gallery fetch's cache behavior (`BaseCharacterPhotosController.js`'s `#fetchPhotos`, which sends no `X-Skip-Cache` request header for either PC or NPC) rather than the `X-Skip-Cache` behavior used by `fetchCharacterTreasures`/base `fetchCharacter` for NPCs — those two behaviors already differ in the codebase today; keep the photos one consistent with the existing photos.json caller.

Add `specs/assets/js/client/CharacterClient/fetchCharacterPhotosSpec.js`, mirroring the sibling `fetchCharacterTreasuresSpec.js`/`fetchTreasuresPageSpec.js` in the same folder (asserting the built URL, including `per_page`, and the returned response).

### Step 2 — Fetch and merge photos in `CharacterController`

In `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js`:
- Add a `fetchCharacterPhotos(gameSlug, characterId, token)` wrapper delegating to `this.characterClient.fetchCharacterPhotos(this.characterKind, gameSlug, characterId, token)`, mirroring the existing `fetchCharacterTreasures` wrapper (lines 79-81).
- Add a `fetchAndMergePhotos(character, params, token)` method, mirroring `fetchAndMergeTreasures` (lines 212-217) exactly in shape: on success, merge `{ ...character, photos: Array.isArray(photos) ? photos : [] }`; on any failure (non-ok response, thrown error, or a non-array body), degrade to `photos: []` rather than failing the page load.
- Wire it into the `loadCharacter` chain (lines 227-236), alongside `fetchAndMergeTreasures`, so both run unconditionally on every character load (not gated behind `can_edit`, unlike `fetchAndMergeAccess`/`loadFullCharacter`):

  ```js
  loadCharacter(params, safeSet) {
    const token = AuthStorage.getToken();

    return this.fetchCharacter(params.game_slug, params.character_id, token)
      .then((response) => this.handleCharacterResponse(response))
      .then((character) => this.fetchAndMergeTreasures(character, params, token))
      .then((character) => this.fetchAndMergePhotos(character, params, token))
      .then((character) => this.fetchAndMergeAccess(character, params, token, safeSet))
      .catch(() => safeSet(this.setError, 'Unable to load character.'))
      .finally(() => safeSet(this.setLoading, false));
  }
  ```

### Step 3 — Update specs

- `specs/assets/js/components/resources/character/pages/controllers/CharacterController/support.js`: add a `fetchCharacterPhotos` stub/override to `StubCharacterController` and `buildController`, mirroring the existing `fetchCharacterTreasures` entries.
- Add `specs/assets/js/components/resources/character/pages/controllers/CharacterController/fetchAndMergePhotosSpec.js`, mirroring `fetchAndMergeTreasuresSpec.js` line for line (success merge, and the three degraded cases: non-ok response, thrown error, non-array body).
- `specs/assets/js/components/resources/character/pages/controllers/CharacterController/loadCharacterSpec.js`: every `expect(setCharacter).toHaveBeenCalledWith({...})` assertion currently includes `treasures: []` — add `photos: []` alongside it (the default stub returns an empty array), in all four assertions in this file.
- Check `specs/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController/**` for any assertion on the exact shape of the merged character object (via the shared `loadController`) and update the same way if it asserts on `treasures`/omits `photos`.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — add `fetchCharacterPhotos`.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js` — add `fetchCharacterPhotos` wrapper, `fetchAndMergePhotos`, and wire it into `loadCharacter`.
- `frontend/specs/assets/js/client/CharacterClient/fetchCharacterPhotosSpec.js` — new spec.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterController/support.js` — stub updates.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterController/fetchAndMergePhotosSpec.js` — new spec.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterController/loadCharacterSpec.js` — assertion updates.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `checks`)

## Notes

- No changes needed in `CharacterHelper.jsx`, `CharacterPhotosPreview.jsx`, or `CharacterPhotosPreviewHelper.jsx` — they already consume `character.photos ?? []` generically and already cap the rendered grid at `MAX_PREVIEW_PHOTOS`; that slice becomes a harmless no-op once the backend already returns at most 6 photos, and is fine to leave as a defensive safety net.
- Do not add any gating to skip the photos fetch on the edit page — follow the existing `treasures` precedent of fetching unconditionally in the shared `loadCharacter` flow, even though the edit page doesn't render the preview.
