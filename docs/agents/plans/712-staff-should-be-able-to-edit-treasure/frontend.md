# Frontend Plan: Staff should be able to edit treasure

Main plan: [plan.md](plan.md)

## Shared contracts

- Can rely on the backend adding `can_exchange_treasure` (boolean) to the character detail
  response (`GET /games/:game_slug/pcs/:id.json` / `.../npcs/:id.json`), already fetched by
  `CharacterClient.fetchCharacter` and stored as part of the `character` state in
  `CharacterContextController`. This field is **not** overwritten by
  `CharacterContextController#mergeAccess` (that method only overwrites `can_edit`/
  `game_can_edit`), so it's readable directly off the merged character object, the same way
  `character.can_edit_money` already is.
- `character.game_can_edit` (DM/superuser only) stays exactly as-is — do not repurpose it for
  the exchange-button gate; it must keep driving only the modal's regular-vs-`all.json` endpoint
  choice, so staff never routes through the hidden-treasure endpoint.

## Implementation Steps

### Step 1 — Gate the "Exchange Treasure" button on the new field

In `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx`
(line 116), change:

```js
gameSlug, listType, basePath, backHref, canEdit: character?.can_edit, refreshToken, activeFilters,
```

to source `canEdit` from `character?.can_exchange_treasure` instead of `character?.can_edit`.
This is the flag `CharacterTreasuresHelper.render` checks (line 58,
`if (!state.canEdit) return null;`) to decide whether to render the "Add Treasure"/"Exchange
Treasure" button at all — so this one change makes the button appear for staff on both the PC and
NPC treasures pages (both route through this same shared component).

Do **not** change `buildExchangeCharacter`'s `canEdit: character?.game_can_edit` (line 51) — that
prop feeds `TreasureExchangeModal`'s choice between the regular and `all.json` (hidden-treasure)
acquire endpoints, and must stay DM/superuser-only.

### Step 2 — Tests

- `frontend/specs/assets/js/components/resources/character/pages/CharacterTreasuresSpec.js` —
  add/update a case asserting the "Exchange Treasure" button renders when
  `character.can_exchange_treasure` is `true` even if `character.can_edit` is `false` (the staff
  case), and stays hidden when both are `false`. Check existing cases that currently assert on
  `can_edit` for this button and update them to use `can_exchange_treasure` instead, since that's
  the field actually driving the prop after this change.
- `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterTreasuresHelperSpec.js` —
  no change expected (it only consumes the already-abstracted `canEdit` prop), but re-run to
  confirm no regression.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/shared/CharacterTreasures.jsx` —
  source the exchange button's `canEdit` prop from `character.can_exchange_treasure`.
- `frontend/specs/assets/js/components/resources/character/pages/CharacterTreasuresSpec.js` —
  update/add coverage for the new field.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- No new UI strings are introduced (the button/modal already exist and are already reachable by
  DMs/owners today) — no translator involvement needed.
- Backend's `can_exchange_treasure` field must land (or be stubbed in test fixtures) before the
  frontend spec updates can pass against a real character detail response; coordinate merge order
  with the backend agent, or fetch-mock the field directly in specs in the meantime.
