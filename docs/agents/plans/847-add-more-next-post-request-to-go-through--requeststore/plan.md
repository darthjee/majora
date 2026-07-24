# Plan: Fix photo upload component leaks and migrate NPC slain toggle to RequestStore

Issue: [847-add-more-next-post-request-to-go-through--requeststore.md](../issues/847-add-more-next-post-request-to-go-through--requeststore.md)

## Overview

Three mutation call sites still bypass `RequestStore` even though their resource configs already
define the variants they need (leftover "component leak" cases from #830/#841/#844): the Game show
page's inline photo-upload modal, the NPC list page's inline photo-upload modal, and the NPC list
page's slain/public-slain toggle. All three are additive-config-free — `gameConfig.js` and
`npcConfig.js` already carry the needed variants — so this is purely a call-site + dead-code-removal
change, no `RequestStore.js` changes.

## Context

`docs/agents/migration/README.md` documents the established pattern: mutations dispatch through
`RequestStore.mutate`/`resolvePath`, photo-upload-init entries are `resolvePath`-only, and a
successful mutation purges its resource's cached `GET` data via `RequestStore.purge`. #830 already
migrated the NPC/PC full-record edit (`PATCH.single`, `regular`/`private` variants in
`npcConfig.js`) and the NPC photos page (`POST.single` `photoUploadInit` in `npcConfig.js`). #844
already migrated the game show/edit/create pages' non-photo mutations and `GamePhotos.jsx`'s photo
upload (`photoUploadInit` in `gameConfig.js`). Neither `Game.jsx`'s own inline upload modal nor
`GameNpcs.jsx`'s inline upload modal/slain toggle were switched over at the time, leaving three
hand-built/legacy call sites that duplicate config already sitting unused.

## Implementation Steps

### Step 1 — Migrate `Game.jsx`'s photo upload to `resourceConfig`

In `frontend/assets/js/components/resources/game/pages/Game.jsx`, replace the hand-built
`` `/games/${game.game_slug}/photo_upload.json` `` string with
`resourceConfig.get('POST', 'game', 'single').regular.path({ gameSlug: game.game_slug })`, importing
`resourceConfig` from `../../../../utils/requests/resourceConfig.js` — mirroring
`GamePhotos.jsx`'s existing usage verbatim (same `gameConfig.js` variant, just a different call
site). No purge is needed on success beyond the existing `controller.buildEffect()()` refetch
already wired into `handleUploadSuccess`.

### Step 2 — Migrate `GameNpcs.jsx`'s photo upload to `resourceConfig`

In `frontend/assets/js/components/resources/character/pages/GameNpcs.jsx`, replace the hand-built
`` `/games/${gameSlug}/npcs/${uploadTarget?.id}/photo_upload.json` `` string with
`resourceConfig.get('POST', 'npc', 'single').regular.path({ gameSlug, id: uploadTarget?.id })`,
importing `resourceConfig` from `../../../../utils/requests/resourceConfig.js` — mirroring
`shared/CharacterPhotos.jsx`'s existing NPC-branch usage.

### Step 3 — Migrate the slain toggle to `RequestStore.mutate`

`SlainConfirmController` (`.../elements/controllers/SlainConfirmController.js`) currently calls
`CharacterClient#setNpcSlain`, which PATCHes the DM/admin `full.json` endpoint — the same endpoint
`npcConfig.js`'s `PATCH.single` `private` variant already models (used today by
`BaseCharacterEditController#handleSubmit` with `variantName: 'private'`). `PlayerSlainConfirmController`
calls `CharacterClient#setNpcPublicSlainAsPlayer` → `updateNpcAsPlayer`, which PATCHes the plain
`npcs/:id.json` endpoint — the `regular` variant of the same config entry.

Update both controllers to call `RequestStore.mutate` directly instead of going through
`CharacterClient`, following `BaseCharacterEditController#handleSubmit`'s exact shape:

```js
RequestStore.mutate({
  componentName: 'SlainConfirmController', // or 'PlayerSlainConfirmController'
  resource: 'npc',
  method: 'PATCH',
  quantityType: 'single',
  params: { gameSlug, id: character.id },
  body: fields, // or { slain } for the player-facing one
  variantName: 'private', // 'regular' for PlayerSlainConfirmController
})
```

Force `variantName` explicitly in both (rather than letting `RequestStore` re-resolve permissions) —
`SlainConfirmController` is only ever wired to the DM/admin-only toggle, and
`PlayerSlainConfirmController` is only ever wired to the player-facing one, so there's no live
permission check to defer to. After a successful mutation, call `RequestStore.purge({ resource:
'npc' })` before invoking `onSuccess()`, so the NPC list's cached `GET` data doesn't go stale
(the existing `refresh()` callback re-triggers the list fetch, but without a purge it would just
re-serve the stale cached response).

Drop the now-unused constructor `client` parameter (and its `CharacterClient` import/default) from
both controllers, since neither has any other caller passing a custom client.

### Step 4 — Remove now-dead `CharacterClient` methods

After Step 3, `CharacterClient#setNpcSlain`, `#setNpcPublicSlainAsPlayer`, and `#updateNpcAsPlayer`
have no remaining callers (verified via repo-wide grep — `updateCharacter` is only called by
`setNpcSlain`, which becomes dead too). Delete all four methods from
`frontend/assets/js/client/CharacterClient.js`, and delete their spec files:
`frontend/specs/assets/js/client/CharacterClient/{setNpcSlainSpec,setNpcPublicSlainAsPlayerSpec,updateNpcAsPlayerSpec,updateCharacterSpec}.js`.

### Step 5 — Update specs

- `frontend/specs/assets/js/components/resources/game/pages/GameSpec.js`: assert the upload modal's
  `uploadPath` prop resolves through `resourceConfig.get('POST', 'game', 'single').regular.path(...)`
  instead of the raw string (mirror however `GamePhotosSpec.js` asserts this for the already-migrated
  page).
- `frontend/specs/.../GameNpcsSpec.js`: same assertion, for `npc`/`uploadTarget.id`.
- `SlainConfirmControllerSpec.js` / `PlayerSlainConfirmControllerSpec.js`: replace the
  `CharacterClient` spy with `spyOn(RequestStore, 'mutate')` returning a plain
  `{ ok, status, json: () => Promise.resolve({...}) }` stand-in, asserting the full call args
  verbatim (per the migration doc's spec convention), plus `spyOn(RequestStore, 'purge')` asserting
  it's called with `{ resource: 'npc' }` on success and not called on failure.

### Step 6 — Update the migration README

In `docs/agents/migration/README.md`:
- Move `/#/games/:game_slug` and `/#/games/:game_slug/npcs` (photo upload) into the "Migrated"
  section, tagged with this issue's number.
- Remove the "Character slain toggle" entry from "Not yet migrated" (now migrated as part of this
  issue) — mark it migrated instead, tagged with this issue's number.
- Leave the rest of "Not yet migrated" untouched (game sessions, polls, tasks, treasure-link, staff
  user) — none of that is in scope here.

## Files to Change

- `frontend/assets/js/components/resources/game/pages/Game.jsx` — use `resourceConfig` for the photo-upload path.
- `frontend/assets/js/components/resources/character/pages/GameNpcs.jsx` — use `resourceConfig` for the photo-upload path.
- `frontend/assets/js/components/resources/character/pages/elements/controllers/SlainConfirmController.js` — switch to `RequestStore.mutate`/`purge`.
- `frontend/assets/js/components/resources/character/pages/elements/controllers/PlayerSlainConfirmController.js` — switch to `RequestStore.mutate`/`purge`.
- `frontend/assets/js/client/CharacterClient.js` — remove `setNpcSlain`, `setNpcPublicSlainAsPlayer`, `updateNpcAsPlayer`, `updateCharacter`.
- `frontend/specs/assets/js/client/CharacterClient/setNpcSlainSpec.js` — delete.
- `frontend/specs/assets/js/client/CharacterClient/setNpcPublicSlainAsPlayerSpec.js` — delete.
- `frontend/specs/assets/js/client/CharacterClient/updateNpcAsPlayerSpec.js` — delete.
- `frontend/specs/assets/js/client/CharacterClient/updateCharacterSpec.js` — delete.
- `frontend/specs/assets/js/components/resources/game/pages/GameSpec.js` — update upload-path assertion.
- `frontend/specs/assets/js/components/resources/character/pages/GameNpcsSpec.js` — update upload-path assertion.
- `frontend/specs/.../elements/controllers/SlainConfirmControllerSpec.js` — rewrite around `RequestStore`.
- `frontend/specs/.../elements/controllers/PlayerSlainConfirmControllerSpec.js` — rewrite around `RequestStore`.
- `docs/agents/migration/README.md` — update checklist.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- No `RequestStore.js` or config file changes are needed — both `gameConfig.js` and `npcConfig.js`
  already carry every variant this issue's call sites need; confirmed by reading both files and their
  already-migrated sibling pages (`GamePhotos.jsx`, `shared/CharacterPhotos.jsx`,
  `BaseCharacterEditController.js`).
- Double-check no other component still imports `SlainConfirmController`/`PlayerSlainConfirmController`
  with a custom `client` argument before deleting that constructor parameter (this plan's exploration
  found none, but re-grep before deleting since it's a public constructor signature change).
