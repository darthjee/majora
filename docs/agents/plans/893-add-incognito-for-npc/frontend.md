# Frontend Plan: Add incognito for NPC

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the backend's `incognito` boolean exactly where `hidden` is consumed today: present
only in the DM/admin NPC payloads (`npcs/all.json` list fetch, `npcs/<id>/full.json` edit-form
load), absent from the public NPC payloads. No new permission/role field is added anywhere — the
existing DM/admin-only data-shape gate (the field simply isn't in the payload for anyone else)
is what restricts the badge and the form switch. See [plan.md](plan.md) for the full contract.

## Implementation Steps

### Step 1 — New/edit form switch

Create `frontend/assets/js/components/resources/character/pages/elements/show/CharacterIncognitoSlot.jsx`,
mirroring `CharacterHiddenSlot.jsx` in the same directory verbatim (same `.form-check.form-switch`
markup, same `isFullEditor`-gated `if (!isFullEditor) return null;`), but named
`buildCharacterIncognitoField` / `CharacterIncognitoEditOrNew`, reading `incognito` instead of
`hidden` and calling `handlers.onIncognitoChange`.

Wire it into `frontend/assets/js/components/common/show_page/show_types/configs/npcShowType.js`:
add an `npcIncognitoField` built the same way as `npcHiddenField` (ids
`npc-edit-incognito`/`game-npc-new-incognito`, labels
`npc_edit_page.incognito_label`/`game_npc_new_page.incognito_label` — see
[translator.md](translator.md)), and insert `{ New: npcIncognitoField, Edit: npcIncognitoField }`
into the `left` array immediately after the existing `{ New: npcHiddenField, Edit: npcHiddenField
}` entry, per the issue's "switch, beneath `hidden` switch".

### Step 2 — Edit-page wiring (`/#/games/:game_slug/npcs/:id/edit`)

`frontend/assets/js/components/resources/character/pages/shared/CharacterEdit.jsx`:
- Add `incognito: false` to the `useFormState` initial fields object (next to `hidden: false`).
- Add `setIncognito: (value) => setField('incognito', value)` to the setters object passed to
  `controller.applyLoadedCharacter(...)`.
- Add `onIncognitoChange: handleCheckboxChange('incognito')` to the handlers object passed to
  `EditHelper.render(...)`.

`frontend/assets/js/components/resources/character/pages/controllers/BaseCharacterEditController.js`:
- `applyLoadedCharacter`: add `setters.setIncognito(fields.incognito);` next to
  `setters.setHidden(fields.hidden);`.

`frontend/assets/js/components/resources/character/pages/controllers/CharacterEditFieldsBuilder.js`:
- `fieldsFromCharacter`: add `incognito: character.incognito ?? false,` next to `hidden:
  character.hidden ?? false,`.
- `fullEditorFields`: inside the existing `if (routeSegment === 'npcs') { ... }` block, add
  `fields.incognito = formValues.incognito;` next to `fields.hidden = formValues.hidden;`.
- `playerFields`: do **not** add `incognito` — mirrors `hidden`'s absence there, since a
  player-only NPC editor must never be able to write it.

### Step 3 — Create-page wiring (`/#/games/:game_slug/npcs/new`)

`frontend/assets/js/components/resources/character/pages/GameNpcNew.jsx`:
- Add `incognito: false` to the initial form state (next to `hidden: false`).
- Add `onIncognitoChange: handleCheckboxChange('incognito')` to the handlers passed to
  `GameNpcNewHelper.render(...)`.

`frontend/assets/js/components/resources/character/pages/controllers/GameNpcNewController.js`:
- `submitForm`: inside the `isFullEditor` branch of the `body` ternary only, add `incognito:
  formValues.incognito,` next to `hidden: formValues.hidden,`. Leave the `else` (player-writable)
  branch untouched — a player-created NPC must never carry `incognito`.

### Step 4 — Info badge (list + show page, DM/admin-only)

The codebase already has exactly this mechanism for the `hidden` badge, driven by
`CharacterStatusBadges.build(character)` — reused by both the NPC list page
(`characterListTypes.js` → `InfoBarRules.build` → `ActionsOverlay`'s info bar) and the NPC show
page (`CharacterAvatarHelper.render` → `InfoBarRules.build`). No separate permission check is
needed: `character.incognito` is simply absent from the payload for a non-editor (public
`npcs.json`/`npcs/<id>.json` never include it), so the new rule naturally renders nothing for
them, exactly like `buildHidden` does today.

`frontend/assets/js/components/common/list_types/CharacterStatusBadges.js`:
- Add a `buildIncognito(character)` static method mirroring `buildHidden(character)`: return
  `null` when `!character.incognito`, else `{ icon: Icons.incognito, text:
  Translator.t('character_status_badges.incognito'), variant: null }`.
- In `build()`, inside the `if (!character.is_pc) { ... }` block, push
  `CharacterStatusBadges.buildIncognito(character)` alongside the existing `buildHidden(character)`
  call (order: after `buildHidden`, so the incognito badge lists after hidden when both are
  somehow present).

`frontend/assets/js/utils/ui/Icons.js`: add `incognito: 'bi-incognito',` (Bootstrap Icons
`bi-incognito`, confirmed present in the project's installed `bootstrap-icons@^1.13.1`, not
currently used anywhere else in the codebase).

This single change covers both badge locations from the issue
(`/#/games/:game_slug/npcs` and `/#/games/:game_slug/npcs/:id`) — no separate work needed for
each page.

### Step 5 — Tests

Jasmine specs mirror `frontend/assets/js/` under `frontend/specs/assets/js/`.

- New: `.../pages/elements/show/CharacterIncognitoSlotSpec.js`, mirroring
  `CharacterHiddenSlotSpec.js` (same directory) for the new slot.
- Update `.../pages/controllers/CharacterEditFieldsBuilderSpec.js` — cover `incognito` in
  `fieldsFromCharacter`/`fullEditorFields`, and assert it's absent from `playerFields`'s output.
- Update `.../common/list_types/CharacterStatusBadgesSpec.js` — cover `buildIncognito`/`build()`
  including/excluding the incognito item.
- Update `.../pages/shared/CharacterEditSpec.js` and `.../pages/GameNpcNewSpec.js` (and/or
  `.../pages/CharacterEditSpec.js`, whichever currently covers the `hidden` wiring end-to-end) to
  cover the new `incognito` field/handler passthrough, mirroring their existing `hidden`
  assertions.
- Update `.../pages/controllers/BaseCharacterEditController` spec directory for the
  `applyLoadedCharacter`/`setIncognito` wiring, mirroring the existing `setHidden` coverage.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe npm run lint` (CI job: `frontend-checks`)

## Notes

- Do not build a new/generic "boolean switch slot" abstraction — every other NPC-only scalar
  field (`CharacterHiddenSlot`, `CharacterMoneySlot`, `CharacterAllegianceFieldsSlot`, ...) is its
  own small dedicated file in this codebase; `CharacterIncognitoSlot.jsx` should follow the same
  one-file-per-field convention rather than generalizing `CharacterHiddenSlot.jsx`.
- Translation keys (`npc_edit_page.incognito_label`, `game_npc_new_page.incognito_label`,
  `character_status_badges.incognito`) are added by the `translator` agent — see
  [translator.md](translator.md). Reference the keys by name here; do not add them directly to
  `frontend/assets/i18n/*.yaml`.
