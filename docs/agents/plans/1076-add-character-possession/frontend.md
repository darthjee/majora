# Frontend Plan: Add Character Possession

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" for the full backend endpoint list, permission table, and the resource-config split (character-scoped `GET`/`POST.collection` vs. unconditionally game-level `PATCH`/photo `POST.single`). Depends on the backend plan's endpoints being available before wiring pages against them, but page/component scaffolding can proceed in parallel using `CharacterItem`/`CharacterDocument`/`GamePossession*` as templates.

## Implementation Steps

### Step 1 — Resource config

In `frontend/assets/js/utils/requests/config/possessionConfig.js`, add `kind`-branching (`params.kind === 'game' ? gameXPath(...) : characterXPath(...)`) to `GET.collection.regular.path`, `GET.single.regular.path`, and `POST.collection.regular.path` only — copy `itemConfig.js`'s branching shape. Leave `PATCH.single` and the photo-upload `POST.single` untouched (always game-level — the character pages call these directly against the `GamePossession` id).

In `frontend/assets/js/utils/requests/RequestPermissionResolvers.js`, change `possession.collection`/`possession.single` from unconditional `AccessStore.ensureGamePermissions(gameSlug)` to the same `kind === 'game' ? ensureGamePermissions(gameSlug) : ensureCharacterPermissions(kind, gameSlug, id)` branch `item`'s resolver already has.

### Step 2 — Routes

Add to `frontend/assets/js/utils/routing/HashRouteResolver.js`, next to the item/document blocks for both `pcs` and `npcs` (registering `new`/`:id/edit` before the bare `:id`, matching item's ordering):

```js
['/games/:game_slug/npcs/:character_id/possessions/new', 'npcCharacterPossessionNew'],
['/games/:game_slug/npcs/:character_id/possessions/:id/edit', 'npcCharacterPossessionEdit'],
['/games/:game_slug/npcs/:character_id/possessions/:id', 'npcCharacterPossession'],
['/games/:game_slug/npcs/:character_id/possessions', 'npcCharacterPossessions'],
```

(and the `pcs` mirror).

### Step 3 — List page

Create `frontend/assets/js/components/resources/character/pages/shared/CharacterPossessions.jsx`, `PcCharacterPossessions.jsx`, `NpcCharacterPossessions.jsx` — copy `CharacterItems.jsx`'s structure (it has both the "Create" button and the acquire/remove exchange modal, matching Possession's dual create+acquire capability), not `CharacterDocuments.jsx` (list-only, no create).

### Step 4 — Acquire/Remove tabs

Create `frontend/assets/js/components/resources/character/pages/elements/possessionExchangeTabs.js` and `.../elements/tabs/AcquirePossessionTab.jsx` + `RemovePossessionTab.jsx` (+ their `controllers/AcquirePossessionTabController.js`/`RemovePossessionTabController.js` and `helpers/AcquirePossessionTabHelper.jsx`/`RemovePossessionTabHelper.jsx`) by copying `AcquireDocumentTab.jsx`/`RemoveDocumentTab.jsx`'s files verbatim, renamed and pointed at the possession endpoints (per the issue's "follow precedent, don't extract shared logic" decision) — even though the *files* to copy are Document's (closer boilerplate match, no quantity/fallback logic), the *endpoints* they call are the new possession `acquire`/`remove`/`available` routes.

Add `POST.acquire`/`POST.remove` quantity-types (and an `available` `GET.collection` variant) to `possessionConfig.js` — `item`'s and `document`'s configs already have these; `possession`'s currently doesn't.

### Step 5 — New page (creates GamePossession)

Create `PcCharacterPossessionNew.jsx`/`NpcCharacterPossessionNew.jsx` + shared `CharacterPossessionNew.jsx` and `controllers/CharacterPossessionNewController.js`, copying `CharacterItemNew.jsx`/`CharacterItemNewController.js`'s shape exactly: `POST` via `RequestStore.mutate` to `{ resource: 'possession', quantityType: 'collection', params: { gameSlug, kind: characterKind, id: characterId } }` with `{ name, description, hidden }`, then on `201` with a photo file, upload it via `PhotoUploadSaga` against `{ resource: 'possession', method: 'POST', quantityType: 'single', params: { gameSlug, id: data.game_possession_id } }` (always `kind: 'game'`-equivalent — no `kind` param needed since the photo path is unconditional) before redirecting to the possessions list. Reuse `PhotoUploadModal`'s deferred-upload pattern (see `GamePossessionNew.jsx` for the `PhotoUploadModal` wiring itself) and add a `PossessionNewPhotoUploadFailedAlert.jsx`-equivalent (or reuse the existing one from the `possession` resource's `pages/elements/show/` if it's already resource-generic — check `PossessionNewPhotoUploadFailedAlert.jsx` under `frontend/assets/js/components/resources/possession/pages/elements/show/` first).

### Step 6 — Edit page (acts on GamePossession directly)

Create `PcCharacterPossessionEdit.jsx`/`NpcCharacterPossessionEdit.jsx` + shared `CharacterPossessionEdit.jsx`. Unlike `CharacterItemEdit.jsx` (which edits the `CharacterItem`'s own override fields), this page's form `PATCH`es `GamePossession` directly (`{ resource: 'possession', method: 'PATCH', quantityType: 'single', params: { gameSlug, id: gamePossessionId } }`) and its photo-replace action uses the same hand-built `/games/${gameSlug}/possessions/${gamePossessionId}/photo_upload.json` path `GamePossessionEdit.jsx` already uses — copy `GamePossessionEdit.jsx`'s controller/page shape, adapted to be reached from a character-scoped route (resolve `gamePossessionId` from the `CharacterPossession` fetched via the character-scoped detail endpoint first, then operate on it).

### Step 7 — Detail page (photo-replace on GamePossession)

Create `PcCharacterPossession.jsx`/`NpcCharacterPossession.jsx` + shared `CharacterPossession.jsx`, copying `CharacterItem.jsx`'s structure (Edit button + `PhotoUploadModal` + `RequestStore.purge`) — but build `uploadPath`/`editHref` against the `GamePossession` id (`resourceConfig.get('POST', 'possession', 'single').regular.path({ gameSlug, id: possession.game_possession_id })`), not a character-scoped id pair, matching `GamePossession.jsx`'s own photo-replace wiring. Unlike `CharacterDocument.jsx` (no Edit button, nothing to edit), this page keeps the Edit button since `GamePossession`'s own fields are editable through it.

### Step 8 — Wire into AppHelper

Add the imports and route-key → component entries to `frontend/assets/js/components/helpers/AppHelper.jsx` for all 8 new components (4 keys × pc/npc), next to the existing item/document blocks.

### Step 9 — Specs

Add Jasmine specs mirroring the existing coverage depth for `CharacterItem*`/`CharacterDocument*` (pages, controllers, helpers) and `AcquireItemTab`/`RemoveItemTab` (tabs, controllers, helpers) for every new file, plus `AppHelperSpec.js` and `HashRouteResolver*Spec.js` additions (see the `c7b7a132` commit's frontend spec list for the equivalent GamePossession coverage shape as a density reference).

## Files to Change

- `frontend/assets/js/utils/requests/config/possessionConfig.js` — add `kind`-branching + acquire/remove/available quantity-types
- `frontend/assets/js/utils/requests/RequestPermissionResolvers.js` — `possession` resolver `kind`-branching
- `frontend/assets/js/utils/routing/HashRouteResolver.js` — 8 new route entries
- `frontend/assets/js/components/helpers/AppHelper.jsx` — imports + route-key map
- `frontend/assets/js/components/resources/character/pages/{Pc,Npc}CharacterPossession{,s,New,Edit}.jsx` — new page components
- `frontend/assets/js/components/resources/character/pages/shared/CharacterPossession{,s,New,Edit}.jsx` — shared page logic
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterPossessionNewController.js` (+ Pc/Npc edit controllers) — new
- `frontend/assets/js/components/resources/character/pages/elements/possessionExchangeTabs.js` — new
- `frontend/assets/js/components/resources/character/pages/elements/tabs/{Acquire,Remove}PossessionTab.jsx` (+ controllers/helpers) — new
- `frontend/specs/**` — mirrored spec coverage for every file above

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: frontend test suite)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: frontend lint)

## Notes

- Confirm whether `PossessionNewPhotoUploadFailedAlert.jsx` (or an equivalent) from the `possession` resource's own `new` page can be reused as-is for the character-scoped new page, or needs a character-scoped copy — check its props first (game-level pages may assume a `gameSlug`-only redirect target, which the character-scoped new page can't reuse directly since it should redirect to the possessions list under the character, not the game).
- The exchange-tab *files* to copy in Step 4 are Document's (simpler, no quantity/fallback logic — better match for Possession's thin-join model), but double-check `AcquireItemTab`'s "hidden switch" behavior isn't actually the one needed if Possession's acquire flow turns out to need it — both Item's and Document's Acquire tabs already have the same hidden-switch behavior, so this is a non-issue, but worth a quick diff before committing to the copy.
