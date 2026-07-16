# Frontend Plan: Player should be able to edit NPC

Main plan: [plan.md](plan.md)

## Shared contracts

Backend widens `NpcPlayerUpdateSerializer` to also accept `name`/`role` (unaliased, same wire
key as model field). No backend permissions-endpoint change — keep using the already-merged
`character.is_player` (from `CharacterController#mergeAccess`,
`frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js:156-170`)
as the general-edit signal; `character.can_edit` keeps meaning full editor (dm/admin, or —
for PCs — the owning player), unchanged.

## Implementation Steps

### Step 1 — Show the Edit button to NPC players

File: `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx:67`

Change the button's gate from `character.can_edit` to also allow an NPC player:

```jsx
<ConditionalComponent render={character.can_edit || (character.is_player && !character.is_pc)}>
```

PCs are unaffected (`is_pc` true short-circuits back to `can_edit`-only, which for a PC already
equals dm/admin/owner — correct, no change needed there). Update the `character.is_player`
JSDoc comment above (currently says it only "gates the single player-facing slain/revive
button") to mention it now also gates the Edit button for NPCs.

### Step 2 — Let a player editor see/edit `name` and `role` on the NPC edit form

File: `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx`

Both fields are currently gated strictly on `state.isFullEditor`:
- `#renderNameField` (line ~185): returns `null` unless `state.isFullEditor`.
- The inline `<CharacterRoleField isFullEditor={state.isFullEditor} .../>` (line ~93): the
  component itself (`frontend/assets/js/components/resources/character/pages/elements/CharacterRoleField.jsx`,
  via `CharacterRoleFieldHelper`) renders `null` unless `isFullEditor` is truthy.

Anyone who reaches this render at all is already either a full editor or (NPC-only) a player
editor — `CharacterEdit.jsx:89` already redirects everyone else away before rendering. So for
`idPrefix === 'npc'`, name/role should always be visible once rendering happens at all; for
`idPrefix === 'pc'`, keep the existing full-editor-only behavior (unchanged, since PC ownership
already equals full-editor). Concretely: change `#renderNameField`'s guard to
`if (this.idPrefix !== 'npc' && !state.isFullEditor) return null;`, and pass
`isFullEditor={state.isFullEditor || this.idPrefix === 'npc'}` to `CharacterRoleField` (add a
short comment noting this prop is really "can see/edit this field", not literally "is a full
editor", to avoid confusing a future reader). Update the class-level render() JSDoc
(lines ~36-38) which currently claims `name`/`role` are dm/admin-only — narrow that to `money`
and `private_description` only.

Do **not** touch `#renderHiddenField`, `CharacterMoneyField`, or `CharacterDmNotesField` —
`hidden`/`money`/`private_description` stay full-editor-only, unchanged.

### Step 3 — Send `name`/`role` from the player-editor submit path

File: `frontend/assets/js/components/resources/character/pages/controllers/CharacterEditFieldsBuilder.js`

`playerFields` (line ~69) currently returns `{ public_description, allegiance, links, slain }`.
Add `name: formValues.name` and `role: formValues.role`. `formValues.name`/`.role` are already
seeded and editable in `CharacterEdit.jsx` regardless of editor kind (no state changes needed
there) — Step 2 is what makes their inputs visible to a player editor in the first place.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` — Edit
  button visibility + JSDoc.
- `frontend/assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx` —
  name/role field gating for NPC player editors + JSDoc.
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterEditFieldsBuilder.js` —
  `playerFields` gains `name`/`role`.

## CI Checks

- `frontend`: `npm run coverage` (CI job "Tests", runs the full Jasmine/karma suite with coverage)
- `frontend`: `npm run lint` (CI job "Check JS Lint")

## Notes

- Existing specs live in
  `frontend/specs/assets/js/components/resources/character/pages/helpers/CharacterHelper/`,
  `.../helpers/BaseCharacterEditHelper/`, and
  `.../controllers/CharacterEditFieldsBuilderSpec.js` — add cases there rather than new files,
  following whatever split convention the existing specs in those locations already use.
- Add/extend specs for: Edit button visible for `{ can_edit: false, is_player: true, is_pc: false }`
  and still hidden for a PC with the same flags; `name`/`role` fields rendered (and editable) for
  an NPC player editor (`isFullEditor: false`, `idPrefix: 'npc'`) but still hidden for a non-full
  PC editor; `CharacterEditFieldsBuilder.playerFields` includes `name`/`role` in its output.
