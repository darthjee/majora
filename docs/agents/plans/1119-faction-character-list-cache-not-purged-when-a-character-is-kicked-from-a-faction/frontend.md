# Frontend Plan: Faction Character List Cache Not Purged When A Character Is Kicked From A Faction

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the new endpoint shape (see [plan.md](plan.md#shared-contracts)):

- `POST /games/:game_slug/{pcs,npcs}/:character_id/factions/:faction_id/remove.json`
- `POST /games/:game_slug/{pcs,npcs}/:character_id/factions/:faction_id/remove/all.json`

`faction_id` must be sent as part of the URL (an extra `params` field the path builder reads) —
the request body must no longer include `game_faction_id`. Backend depends on this shape; land
together.

## Implementation Steps

### Step 1 — Add `factionId` to the remove path builders

In `frontend/assets/js/utils/requests/config/factionConfig.js`, update `removePath`/`removeAllPath`
to read a `factionId` param and include it in the URL:

```js
const removePath = ({ gameSlug, kind, id, factionId }) => `/games/${gameSlug}/${kind}/${id}/factions/${factionId}/remove.json`;
const removeAllPath = ({ gameSlug, kind, id, factionId }) => `/games/${gameSlug}/${kind}/${id}/factions/${factionId}/remove/all.json`;
```

Update the file's top JSDoc description of `remove` to mention the new `factionId` param.

### Step 2 — Update `FactionCharactersPanelController.kick()`

In `frontend/assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelController.js`,
`kick()` already receives `factionId` as an argument. Move it into `params` and drop the body:

```js
return RequestStore.mutate({
  componentName: 'FactionCharactersPanelController',
  resource: 'faction',
  method: 'POST',
  quantityType: 'remove',
  params: {
    gameSlug, kind, id: character.id, factionId,
  },
  variantName: isDmOrAdmin ? 'private' : 'regular',
}).then((response) => FactionCharactersPanelController.#parseActionResponse(response));
```

(Drop the now-unused `body: { game_faction_id: factionId }` line.)

### Step 3 — Update `RemoveFactionTabController.remove()`

In `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveFactionTabController.js`,
`remove()` currently builds `body` from `fields.gameFactionId` via `#toBody`. Move `gameFactionId`
into `params.factionId` instead and drop the body entirely:

```js
remove(gameSlug, characterId, isPc, fields, canEdit = false) {
  const kind = RemoveFactionTabController.#characterKind(isPc);

  return RequestStore.mutate({
    componentName: 'RemoveFactionTabController',
    resource: 'faction',
    method: 'POST',
    quantityType: 'remove',
    params: {
      gameSlug, kind, id: characterId, factionId: fields.gameFactionId,
    },
    variantName: canEdit ? 'private' : 'regular',
  }).then((response) => this.#parseActionResponse(response));
}
```

Remove the now-unused `#toBody` static helper if nothing else calls it.

### Step 4 — Update specs

Update the Jasmine specs covering `factionConfig.js`'s `remove`/`removeAll` paths and both
controllers' `kick()`/`remove()` methods to assert the new URL shape (with `factionId` in the
path) and the absence of a `game_faction_id`/body field in the mutate call.

## Files to Change

- `frontend/assets/js/utils/requests/config/factionConfig.js` — `removePath`/`removeAllPath` take `factionId`.
- `frontend/assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelController.js` — `kick()` passes `factionId` via `params`, drops `body`.
- `frontend/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveFactionTabController.js` — `remove()` passes `factionId` via `params`, drops `body`/`#toBody`.
- Corresponding spec files under `frontend/specs/` for the three files above.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`, runs via `npm run coverage`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- This is a breaking change with no backward-compat window — land alongside the backend change in
  the same PR; do not deploy frontend ahead of backend or vice versa.
