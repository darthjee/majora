# Frontend Plan: Add character treasures

Main plan: [plan.md](plan.md)

## Shared contracts

- Consumes the two new backend endpoints and item shape described in
  [plan.md](plan.md#new-api-endpoints-produced-by-backend-consumed-by-frontend):
  `GET /games/:game_slug/pcs/:character_id/treasures.json` and the `npcs` equivalent,
  each item `{ id, name, quantity, value }`.
- Owns the two new hash routes listed in
  [plan.md](plan.md#frontend-routes-frontend-only-no-backend-involvement).
- Consumes the translation keys listed in [translator.md](translator.md) — coordinate
  exact key names with that plan before using them (they must match exactly).

## Implementation Steps

### Step 1 — Client methods

In `frontend/assets/js/client/CharacterClient.js`, add, next to `fetchPc`/`fetchNpc`:

```js
fetchPcTreasures(gameSlug, characterId, token) {
  return this.#fetchCharacter('pcs', gameSlug, characterId, token, 'treasures');
}

fetchNpcTreasures(gameSlug, characterId, token) {
  return this.#fetchCharacter('npcs', gameSlug, characterId, token, 'treasures');
}
```

(The private `#fetchCharacter(segment, gameSlug, characterId, token, suffix)` helper
already supports an arbitrary suffix, exactly like `fetchPcFull`/`fetchPcAccess` do —
no changes needed there.)

### Step 2 — New preview limit constant

Add `MAX_PREVIEW_TREASURES = 12` next to `MAX_PREVIEW_CHARACTERS` in
`frontend/assets/js/components/elements/characterPreviewConstants.js` (or a new sibling
constants file if that one is meant to stay character-specific — check the existing file's
naming/scope before deciding).

### Step 3 — Preview section component + helper

Add a new small preview section, mirroring `CharacterPreviewSection.jsx` /
`CharacterPreviewSectionHelper.jsx` but rendering treasure rows (name + quantity) instead
of `CharacterCard`s — e.g.
`frontend/assets/js/components/elements/TreasurePreviewSection.jsx` +
`frontend/assets/js/components/elements/helpers/TreasurePreviewSectionHelper.jsx`.
Reuse the existing `character_preview_section.see_all` translation key for the "See all
{{title}}" link (same interpolation pattern), and the new
`character_page.treasures_title` key for the heading. Slice to `MAX_PREVIEW_TREASURES`
client-side, exactly like `CharacterPreviewSectionHelper` does with
`MAX_PREVIEW_CHARACTERS`.

### Step 4 — Wire the preview into the character detail page

In `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx`, render the new
preview section under the existing content, passing `character.treasures` (added in Step
6 below), the "see all" href
(`#/games/${character.game_slug}/${segment}/${character.id}/treasures`), and the new
title key. Update the JSDoc `@param` block for `character` to document the new
`character.treasures` array.

### Step 5 — Fetch treasures alongside the character

In `frontend/assets/js/components/pages/controllers/CharacterController.js`, add an
abstract `fetchCharacterTreasures(gameSlug, characterId, token)` method (same
`throw new Error(...)` pattern as `fetchCharacter`/`fetchCharacterFull`/
`fetchCharacterAccess`), and call it from `loadCharacter` (or a new step chained after
`fetchAndMergeAccess`) to fetch a first page of treasures and merge them onto the
character object as `character.treasures` before the final `setCharacter` call. On
failure, default to `[]` rather than failing the whole page load (treasures are
supplementary, not essential — mirror how `fetchAndMergeAccess`/`loadFullCharacter`
already degrade gracefully via `.catch(() => character)`).

Implement `fetchCharacterTreasures` in both:
- `frontend/assets/js/components/pages/controllers/PcCharacterController.js` →
  `this.characterClient.fetchPcTreasures(gameSlug, characterId, token)`
- `frontend/assets/js/components/pages/controllers/NpcCharacterController.js` →
  `this.characterClient.fetchNpcTreasures(gameSlug, characterId, token)`

### Step 6 — Full list page

Add a new page mirroring `GameTreasures.jsx` / `GameTreasuresController.js` /
`GameTreasuresHelper.jsx`, but using the `Table` element (columns: name, quantity, value)
the way `StaffUsersHelper.jsx` does, instead of `TreasureCard` (there's no photo to show
and no per-row actions since this is read-only):
- `frontend/assets/js/components/pages/CharacterTreasures.jsx` (or two thin pages,
  `PcCharacterTreasures.jsx` / `NpcCharacterTreasures.jsx`, if that matches the existing
  Pc/Npc split convention better — check how `PcCharacterPhotos.jsx` /
  `NpcCharacterPhotos.jsx` are split before deciding)
- `frontend/assets/js/components/pages/controllers/CharacterTreasuresController.js`
  (or Pc/Npc variants), fetching via `GenericClient#fetchIndex` against
  `/games/:game_slug/pcs/:character_id/treasures.json` (or `npcs`), following the same
  shape as `GameTreasuresController.js`.
- `frontend/assets/js/components/pages/helpers/CharacterTreasuresHelper.jsx` (or Pc/Npc
  variants) rendering the `Table`, `Pagination`, and a back link to the character detail
  page.

### Step 7 — Routes and page registry

In `frontend/assets/js/utils/HashRouteResolver.js`, register (next to the existing
`pcCharacterPhotos`/`npcCharacterPhotos` entries):

```js
this.#router.register('/games/:game_slug/pcs/:character_id/treasures', 'pcCharacterTreasures');
this.#router.register('/games/:game_slug/npcs/:character_id/treasures', 'npcCharacterTreasures');
```

Register the new page components in `frontend/assets/js/components/helpers/AppHelper.jsx`
under keys `pcCharacterTreasures` / `npcCharacterTreasures`.

### Step 8 — Tests

Add Jasmine specs for every new/changed file above, mirroring the existing spec
conventions (e.g. `frontend/specs/.../GameTreasuresSpec.js`,
`frontend/specs/.../CharacterPreviewSectionHelperSpec.js`,
`frontend/specs/.../CharacterHelperSpec.js`) — cover the preview section rendering/slicing,
the controller's graceful degradation on a failed treasures fetch, the new routes
resolving to the right page keys, and the full list page's loading/error/success states.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — `fetchPcTreasures`/`fetchNpcTreasures`
- `frontend/assets/js/components/elements/characterPreviewConstants.js` —
  `MAX_PREVIEW_TREASURES`
- `frontend/assets/js/components/elements/TreasurePreviewSection.jsx` +
  `helpers/TreasurePreviewSectionHelper.jsx` — new preview section
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — render the preview
  section
- `frontend/assets/js/components/pages/controllers/CharacterController.js`,
  `PcCharacterController.js`, `NpcCharacterController.js` — fetch and merge treasures
- `frontend/assets/js/components/pages/CharacterTreasures.jsx` (or Pc/Npc split) + matching
  controller(s) + helper(s) — new full list page
- `frontend/assets/js/utils/HashRouteResolver.js` — two new route registrations
- `frontend/assets/js/components/helpers/AppHelper.jsx` — two new page registrations
- `frontend/specs/...` — specs for every file above

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe yarn test` or `npm run coverage` (CI job:
  `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`,
  `npm run lint`)
- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job:
  `frontend-checks`) — must pass once translator's keys land, since this issue adds
  English-only keys and `check_i18n` verifies key parity across languages.

## Notes

- Confirm with [translator.md](translator.md) whether new keys are added to `en.yaml` only
  (today's only bundled language) or need `check_i18n` awareness beyond that.
- Double-check whether the Pc/Npc character detail/photos pages are implemented as two
  thin per-type pages or a single shared page with a segment prop, and follow whichever
  convention already exists for the new treasures full-list page — the plan above assumes
  the former based on `PcCharacter.jsx`/`NpcCharacter.jsx` and
  `PcCharacterPhotos.jsx`/`NpcCharacterPhotos.jsx` both existing as separate files.
