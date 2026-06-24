# Frontend Plan: Add Character Hidden Description

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **consumes**:
- The `description` field in character detail responses is now called `public_description`. Update all code that reads `character.description` to read `character.public_description`.
- Two new endpoints:
  - `GET /games/<slug>/pcs/<id>/full.json` — requires auth token; returns 403 if not editor; on success returns character object with `public_description` and `private_description`.
  - `GET /games/<slug>/npcs/<id>/full.json` — same contract.
- The PATCH endpoint now also accepts `private_description` in the payload.
- New translation keys (produced by the translator agent):
  ```yaml
  character_full_page:
    loading: "Loading character..."
    private_description_label: "DM Notes"
  ```

## Implementation Steps

### Step 1 — Update CharacterClient

In `frontend/assets/js/client/CharacterClient.js`, add two methods:

```js
fetchPcFull(gameSlug, characterId, token) {
  return this.#fetchCharacter('pcs', gameSlug, characterId, token, 'full');
}

fetchNpcFull(gameSlug, characterId, token) {
  return this.#fetchCharacter('npcs', gameSlug, characterId, token, 'full');
}
```

Update `#fetchCharacter` to accept an optional `suffix` parameter so it constructs `/games/${gameSlug}/${segment}/${characterId}/${suffix}.json` when a suffix is given, and `/games/${gameSlug}/${segment}/${characterId}.json` when it is not.

### Step 2 — Update field references from description to public_description

Wherever any component, helper, or controller reads `character.description`, change it to `character.public_description`. Key locations:
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — passes `description` prop to `CharacterInfo`.
- `frontend/assets/js/components/elements/CharacterInfo.jsx` and `CharacterInfoHelper.jsx` — the prop is named `description`; it can keep the same internal prop name but the source data must come from `character.public_description`.
- `frontend/assets/js/components/pages/controllers/NpcCharacterEditController.js` — `applyLoadedCharacter` seeds `setDescription` from `fields.description`; update to `fields.public_description`.
- `frontend/assets/js/components/pages/controllers/PcCharacterEditController.js` — same pattern, update `resolveLoadedCharacter` to use `public_description`.
- Edit pages (`NpcCharacterEdit.jsx`, `PcCharacterEdit.jsx`) — the local state variable `description` stays, but the PATCH payload key sent to the server must be `public_description` (not `description`).

### Step 3 — Add NpcCharacterFull and PcCharacterFull pages

Create two new page components:
- `frontend/assets/js/components/pages/NpcCharacterFull.jsx`
- `frontend/assets/js/components/pages/PcCharacterFull.jsx`

These follow the same pattern as `NpcCharacter.jsx` / `PcCharacter.jsx` but:
1. Call `characterClient.fetchNpcFull` / `fetchPcFull` instead of `fetchNpc` / `fetchPc`.
2. On 403 response (not editor), silently redirect to the regular detail page (`#/games/<slug>/npcs/<id>` or `/pcs/<id>`).
3. On success, render an extended detail view that shows both `public_description` and `private_description`.

Create corresponding controllers:
- `frontend/assets/js/components/pages/controllers/NpcCharacterFullController.js`
- `frontend/assets/js/components/pages/controllers/PcCharacterFullController.js`

These controllers call the `fetchNpcFull`/`fetchPcFull` methods and handle the 403 redirect.

Create a rendering helper:
- `frontend/assets/js/components/pages/helpers/CharacterFullHelper.jsx`

`CharacterFullHelper.render(character, backHref)` renders the same layout as `CharacterHelper.render` but adds a "DM Notes" section below the public description when `private_description` is non-empty, using the `character_full_page.private_description_label` translation key.

### Step 4 — Add private_description to edit pages

In `NpcCharacterEdit.jsx` and `NpcCharacterEditHelper.jsx`:
- Add a `privateDescription` state variable.
- Add a new `FormField` for `private_description` (label from `npc_edit_page.private_description_label`).
- Include `private_description: formValues.privateDescription` in the PATCH payload inside `NpcCharacterEditController.submitForm`.
- Seed `privateDescription` from `character.private_description` in `applyLoadedCharacter`.

Do the same in `PcCharacterEdit.jsx`, `PcCharacterEditHelper.jsx`, and `PcCharacterEditController.js`.

### Step 5 — Register routes for the new pages

In `frontend/assets/js/components/AppController.js` (or wherever hash routes are registered), add routes for:
- `#/games/:game_slug/npcs/:character_id/full`
- `#/games/:game_slug/pcs/:character_id/full`

mapping to `NpcCharacterFull` and `PcCharacterFull` respectively.

### Step 6 — Write Jasmine specs

Add spec files mirroring existing controller/helper specs:
- `frontend/specs/.../controllers/NpcCharacterFullControllerSpec.js`
- `frontend/specs/.../controllers/PcCharacterFullControllerSpec.js`
- `frontend/specs/.../helpers/CharacterFullHelperSpec.js`

Update existing specs that check for `character.description` in rendered output or controller logic to use `character.public_description`.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — add `fetchPcFull`, `fetchNpcFull`
- `frontend/assets/js/components/pages/helpers/CharacterHelper.jsx` — use `public_description`
- `frontend/assets/js/components/pages/helpers/CharacterFullHelper.jsx` — new file
- `frontend/assets/js/components/pages/NpcCharacterFull.jsx` — new file
- `frontend/assets/js/components/pages/PcCharacterFull.jsx` — new file
- `frontend/assets/js/components/pages/controllers/NpcCharacterFullController.js` — new file
- `frontend/assets/js/components/pages/controllers/PcCharacterFullController.js` — new file
- `frontend/assets/js/components/pages/NpcCharacterEdit.jsx` — add `private_description` field
- `frontend/assets/js/components/pages/PcCharacterEdit.jsx` — add `private_description` field
- `frontend/assets/js/components/pages/helpers/NpcCharacterEditHelper.jsx` — add field
- `frontend/assets/js/components/pages/helpers/PcCharacterEditHelper.jsx` — add field
- `frontend/assets/js/components/pages/controllers/NpcCharacterEditController.js` — update payload, seed
- `frontend/assets/js/components/pages/controllers/PcCharacterEditController.js` — update payload, seed
- `frontend/assets/js/components/AppController.js` — register new routes
- `frontend/specs/...` — new and updated spec files

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm test` (CI job: `jasmine`)
- `frontend/`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- Keep the internal prop name `description` inside `CharacterInfo`/`CharacterInfoHelper` unchanged if you prefer; what matters is that the value passed comes from `character.public_description`.
- The `CharacterFullHelper` private description section should only render when `private_description` is truthy, mirroring how `#renderDescription` works.
- The 403 redirect from the `/full` page back to the regular detail page gives a graceful fallback for editors who lose access mid-session.
