# Plan: Request to Character items, treasures and documents should go through `RequestStore`

Issue: [805-request-to-character-items--treasures-and-documents-shold-go-through--requeststore.md](../../issues/805-request-to-character-items--treasures-and-documents-shold-go-through--requeststore.md)

## Overview

The PC/NPC character show pages (`CharacterController`) already fetch the base character record
through `RequestStore.ensure` (`pc`/`npc` resource), but the item/treasure/document previews
below it still bypass `RequestStore` and hit `CharacterClient`'s plain HTTP methods directly. This
means editors never see hidden items/treasures/documents in these previews, unlike the standalone
list pages and `GameController`'s PC/NPC previews, which already resolve permissions correctly
through `RequestStore`. The fix rewires the three preview fetches to go through `RequestStore`
using resource configs (`item`, `treasure`, `document`) that already exist and already back the
standalone list pages — this is frontend-only wiring, no backend changes needed.

## Context

- `CharacterController#loadCharacter` (`CharacterController.js:163-181`) chains
  `fetchAndMergeTreasures` → `fetchAndMergeItems` → `fetchAndMergeDocuments` → `fetchAndMergePhotos`,
  all defined in the parent class `CharacterListsController.js`.
- Those three methods (`CharacterListsController.js:81-115`) each call a same-named wrapper
  (`fetchCharacterTreasures`/`fetchCharacterItems`/`fetchCharacterDocuments`, lines 32-58) which
  delegates to `CharacterClient.fetchCharacterTreasures/Items/Documents` — plain HTTP calls to the
  public, non-`can_edit`-aware endpoint (`.../treasures.json`, `.../items.json`,
  `.../documents.json`), never the `all.json` editor variant.
- `resourceConfig.js` already registers `item`, `treasure`, and `document` GET configs
  (`config/itemConfig.js`, `config/treasureConfig.js`, `config/documentConfig.js`), each with a
  `collection.regular`/`collection.private` pair keyed by `{ gameSlug, kind, id }` where `kind` is
  `'pcs'`/`'npcs'` — this is exactly the shape `CharacterListsController.characterKind` already
  provides (no `'npc'`/`'pc'` singular remapping needed, unlike `CharacterController#resourceName`
  for the base character fetch).
- `RequestPermissionResolvers.js` already resolves `can_edit` for these three resources at the
  character level via `AccessStore.ensureCharacterPermissions(kind, gameSlug, id)` for `item`/
  `document`, and via `AccessStore.ensureGamePermissions(gameSlug)` for NPC `treasure` collections
  (PC `treasure` collections have no restricted variant at all — `treasureConfig.js`'s `private`
  resolves to the exact same path as `regular` when `kind === 'pcs'`, which is expected and needs
  no special-casing here).
- `GameController.js:120-152` (`#fetchPcsPreview`/`#fetchNpcsPreview`) is the reference pattern:
  call `RequestStore.ensure({ componentName, resource, quantityType: 'collection', params, query:
  { per_page: MAX_PREVIEW_ITEMS } })`, then `.then(({ data }) => ...).catch(() => ...)` to degrade
  to an empty list on failure, never blocking the rest of the page.
- `MAX_PREVIEW_ITEMS` (`components/common/cards/characterPreviewConstants.js:9`, value `5`) is the
  shared constant already used by `GameController`'s previews; `CharacterClient.js` currently
  duplicates it locally as `PREVIEW_PAGE_SIZE` purely because "nothing under `client/` imports from
  `components/`" — once `CharacterClient`'s three methods are removed, that local constant becomes
  dead and should be removed too, with the new `RequestStore.ensure` calls importing
  `MAX_PREVIEW_ITEMS` directly, same as `GameController` does.
- `CharacterListMerger.merge` (`CharacterListMerger.js`) currently expects a `Promise<Response>`
  and calls `.json()` on it — that shape doesn't fit `RequestStore.ensure()`'s
  `Promise<{data, pagination}>` result, so it needs a second static method for the
  `RequestStore`-backed callers, while the existing `Response`-based `merge` stays as-is for
  `fetchAndMergePhotos` (out of scope, still on the old `CharacterClient` path — see the issue file
  for why photos aren't included here).
- Photos are explicitly out of scope (see issue file): no `RequestStore` resource type exists for
  photos, and adding one would require new backend endpoint work first.

## Implementation Steps

### Step 1 — Add a `RequestStore`-result merge helper to `CharacterListMerger`

Add a new static method (e.g. `mergeResource(character, key, requestPromise)`) that takes the
`Promise<{data, pagination}>` returned by `RequestStore.ensure`, and mirrors the existing `merge`
method's degrade-on-failure behavior:

```js
static mergeResource(character, key, requestPromise) {
  return requestPromise
    .then(({ data }) => ({ ...character, [key]: Array.isArray(data) ? data : [] }))
    .catch(() => ({ ...character, [key]: [] }));
}
```

Keep the existing `merge` method unchanged (still used by `fetchAndMergePhotos`), and update the
class-level doc comment to reflect that it's now specific to the `Response`-based (photos) path.

### Step 2 — Rewire `CharacterListsController`'s treasure/item/document fetches

In `CharacterListsController.js`:

- Delete the three thin wrapper methods `fetchCharacterTreasures`, `fetchCharacterItems`,
  `fetchCharacterDocuments` (lines 32-58) — nothing needs the raw fetch in isolation anymore.
- Rewrite `fetchAndMergeTreasures`, `fetchAndMergeItems`, `fetchAndMergeDocuments` to call
  `RequestStore.ensure` directly, mirroring `GameController`'s `#fetchPcsPreview` pattern, and use
  `CharacterListMerger.mergeResource` from Step 1. Example for items:

```js
fetchAndMergeItems(character, params) {
  return CharacterListMerger.mergeResource(
    character, 'items',
    RequestStore.ensure({
      componentName: 'CharacterController',
      resource: 'item',
      quantityType: 'collection',
      params: { gameSlug: params.game_slug, kind: this.characterKind, id: params.character_id },
      query: { per_page: MAX_PREVIEW_ITEMS },
    }),
  );
}
```

  Same shape for `treasures` (`resource: 'treasure'`) and `documents` (`resource: 'document'`).
  Drop the now-unused `token` parameter from these three methods (RequestStore reads the token
  internally via `AuthStorage`), and update `CharacterController#loadCharacter`'s three call sites
  accordingly — `fetchAndMergePhotos`'s call keeps passing `token` since it's unaffected.
- Add the `RequestStore` and `MAX_PREVIEW_ITEMS` imports this file now needs.

### Step 3 — Remove the now-dead `CharacterClient` methods

Delete `fetchCharacterTreasures`, `fetchCharacterItems`, `fetchCharacterDocuments` from
`CharacterClient.js` (lines 80-126), and the now-unused `PREVIEW_PAGE_SIZE` constant (lines 3-11) —
confirm no other caller references them first (only `CharacterListsController` did, per Step 2).
Leave `fetchCharacterPhotos` and every other method untouched.

### Step 4 — Update the stale doc comment in `characterPreviewConstants.js`

`PREVIEW_LIST_TYPES`'s doc comment currently says `treasure`/`item`'s endpoints are built by
`CharacterClient#fetchCharacterTreasures`/`#fetchCharacterItems`. Update it to say `treasure`/
`item`/`document` are now fetched through `RequestStore.ensure()` the same way `pc`/`npc` already
are, mirroring the note directly above it about `GameController`.

### Step 5 — Update specs

Every spec exercising the old flow needs to move from mocking `characterClient.fetchCharacterX`
(returning `{ ok, json() }`-shaped fake `Response`s) to mocking `RequestStore.ensure` (returning
`{ data, pagination }`-shaped resolved/rejected promises), following whatever spy pattern
`GameController`'s own preview specs already use for `RequestStore.ensure`. Specifically:

- Delete `frontend/specs/assets/js/client/CharacterClient/fetchCharacterTreasuresSpec.js`,
  `fetchCharacterItemsSpec.js`, `fetchCharacterDocumentsSpec.js` (methods no longer exist).
- Rewrite `frontend/specs/assets/js/components/resources/character/pages/controllers/
  CharacterListsControllerSpec.js`'s treasure/item/document sections to spy on `RequestStore.ensure`
  instead of `characterClient.fetchCharacterX`, and assert the resource/quantityType/params/query
  passed to it.
- Rewrite `CharacterController/fetchAndMergeTreasuresSpec.js`, `fetchAndMergeItemsSpec.js`,
  `fetchAndMergeDocumentsSpec.js` the same way, including their "degraded" (failure-fallback) cases.
- Update `CharacterController/support.js`'s stub `characterClient` (no longer needs
  `fetchCharacterTreasures`/`fetchCharacterItems`/`fetchCharacterDocuments` stubs) and instead stub/
  spy `RequestStore.ensure` where the shared test builder wires up default resolved responses.
- Update every `CharacterDetailController/*Spec.js` file that currently seeds
  `characterClient.fetchCharacterTreasures/Items/Documents` fakes (`basicFetchSpec.js`,
  `fullDetailFetchSpec.js`, `tokenHandlingSpec.js`, `canEditResolutionSpec.js`,
  `errorHandlingSpec.js`) to instead seed `RequestStore.ensure` fakes for these three resources,
  keeping `fetchCharacterPhotos` mocks as they are.
- Update `CharacterEditController/buildEffectSpec.js` and `BaseCharacterEditController/
  buildEffectSpec.js` the same way if they exercise `CharacterListsController`'s treasure/item/
  document fetch methods (they currently do, via the shared `characterClient` spy list).

## Files to Change

- `frontend/assets/js/components/resources/character/pages/controllers/CharacterListMerger.js` —
  add `mergeResource` for the `RequestStore`-shaped result.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterListsController.js`
  — remove the three `CharacterClient` wrapper methods, rewire `fetchAndMergeTreasures/Items/
  Documents` to `RequestStore.ensure`.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js` —
  drop the now-unused `token` arg from the three call sites inside `loadCharacter`.
- `frontend/assets/js/client/CharacterClient.js` — remove `fetchCharacterTreasures`,
  `fetchCharacterItems`, `fetchCharacterDocuments`, and `PREVIEW_PAGE_SIZE`.
- `frontend/assets/js/components/common/cards/characterPreviewConstants.js` — update the stale doc
  comment on `PREVIEW_LIST_TYPES`.
- Specs under `frontend/specs/assets/js/components/resources/character/pages/controllers/` and
  `frontend/specs/assets/js/client/CharacterClient/` — see Step 5.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)

## Notes

- This is a frontend-only change: the backend endpoints these resource configs point at
  (`.../items/all.json`, `.../treasures/all.json` for NPCs, `.../documents/all.json`) already
  exist and are already used by the standalone list pages, so no `backend/` work, migration, or new
  endpoint is needed.
- Behavior change to be aware of during review: editors (GMs, or a PC's owning player) will now see
  hidden items/treasures/documents in the character-page preview grids, matching what they already
  see on the standalone list pages — previously the preview always showed the public/hidden-filtered
  view regardless of role. This is a fix, not a new capability (no new data becomes visible to
  non-editors), but it's the one behavior change worth calling out explicitly in the PR description.
- Photos remain on the old `CharacterClient.fetchCharacterPhotos` path; see the issue file for why
  (no backend "all"/hidden-inclusive endpoint exists yet for photos).
