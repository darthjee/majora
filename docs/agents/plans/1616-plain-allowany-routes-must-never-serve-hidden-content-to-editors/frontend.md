# Frontend Plan: Plain (AllowAny) routes must never serve hidden content to editors

Main plan: [plan.md](plan.md)

## Shared contracts

You can rely on the backend providing (see [plan.md](plan.md#shared-contracts)):

- Every plain NPC GET returns `404` on a hidden NPC for **every** caller, editors included.
  The same applies to `GET /games/<slug>/treasures/<id>.json` on a hidden game treasure.
- `GET /games/<slug>/npcs/<id>/photos/all.json` — CharacterEdit, same paginated `{id, path}`
  shape as `photos.json`, `X-Skip-Cache: true`. NPC only.
- `GET /games/<slug>/treasures/<id>/full.json` — GameEdit, same payload as the plain detail plus
  `hidden`, `X-Skip-Cache: true`.
- Plain PATCH/POST routes are unchanged.

## Implementation Steps

### Step 1 — Route editors' hidden-NPC reads to restricted siblings

Most NPC reads already go through `utils/requests/config/*Config.js`, where a `private` variant
(`full.json`/`all.json`, `permission: 'can_edit'`) is picked for editors. Audit every place that
reads an NPC route **directly** with a plain path, and make editors use the restricted sibling:

- Photos: `BaseCharacterPhotosController#fetchPhotos` and `CharacterClient.fetchCharacterPhotos`
  (used by `CharacterListsController`) call `.../photos.json`. For NPCs whose `can_edit` is true,
  call `.../npcs/<id>/photos/all.json`. The preferred way is a new `characterPhoto` request
  config with `regular`/`private` variants, following `characterDocumentPhotoConfig.js`. PCs stay
  on `photos.json`.
- Check the other direct paths in `CharacterClient.js` (`treasures.json` at the Sell tab, the
  generic `${base}/${suffix}.json` helper) and any controller that builds NPC paths by hand
  (`grep -rn "npcs/\${"`). Each one that an editor can open on a hidden NPC must use the
  restricted sibling.
- Confirm that every config whose `private` variant is the same object as `regular` for an
  NPC GET (e.g. `factionConfig`'s `single`, which is game-level) doesn't depend on a plain NPC
  route serving hidden content.

### Step 2 — Game treasure detail through `full.json`

In `treasureConfig.js`, give `GET.single` a `private` variant for the game-scoped path:
`/games/${gameSlug}/treasures/${id}/full.json`, `permission: 'can_edit'` (game-level, as for
`collection` with `kind === 'game'`), `skipCache: true`. Keep `/treasures/${id}.json` (no
`gameSlug`) on the plain path. Make sure the game treasure page and edit form handle a dm opening
a hidden treasure. If the edit form needs the new `hidden` field, it may read it.

## Files to Change
- `frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterPhotosController.js` — editor NPC photos from `photos/all.json`
- `frontend/assets/js/client/CharacterClient.js` — `fetchCharacterPhotos` and other direct NPC paths
- `frontend/assets/js/utils/requests/config/characterPhotoConfig.js` (new, if the config route is chosen)
- `frontend/assets/js/utils/requests/config/treasureConfig.js` — `GET.single.private`
- `frontend/specs/...` — Jasmine specs for the changed controllers, client and configs

## CI Checks
- `frontend`: inside `make tests`' frontend container, `yarn test` / `yarn lint` (CI jobs: `jasmine`, `frontend-checks`)

## Notes
- Manual check: as dm, open a hidden NPC's detail page, photo gallery, items/documents/treasures
  tabs and summaries, and a hidden game treasure. All of them must load. As a player or
  anonymous user, each must 404 (not found page).
