# Frontend Plan: Staff Can Edit Pc Money

Main plan: [plan.md](plan.md)

## Shared contracts

- New endpoints (backend, already implemented by the time this runs):
  `PUT /games/<slug>/pcs/<id>/money.json`, `PUT /games/<slug>/npcs/<id>/money.json`. Request
  body `{"money": <int>}`. Success: `200` with the same shape as
  `GET .../pcs/<id>.json`/`.../npcs/<id>.json`.
- New `can_edit_money` boolean field, present on the plain detail response
  (`GET .../pcs/<id>.json`, `.../npcs/<id>.json`) and on `full.json` — use this (not `can_edit`)
  to decide whether to render the "Edit" link, since a Staff account may edit money without
  being a full editor.
- After a successful save, close the modal and re-run `controller.buildEffect()()` — it already
  implements the exact reload rule from the issue (full.json when `can_edit`, plain detail
  otherwise), no new logic needed there.

## Implementation Steps

### Step 1 — Client method

Add to `frontend/assets/js/client/CharacterClient.js`, alongside `updateCharacter`:

```js
/**
 * Updates a character's money through the narrow, money-only endpoint (issue #615).
 *
 * @param {string} characterKind - Character kind ('pcs' or 'npcs').
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {string|number} characterId - Character id.
 * @param {string|null} token - Authentication token, if any.
 * @param {number} money - New total money value.
 * @returns {Promise<Response>} fetch response from the money endpoint.
 */
updateCharacterMoney(characterKind, gameSlug, characterId, token, money) {
  return this.putJson(
    `/games/${gameSlug}/${characterKind}/${characterId}/money.json`, token, { money },
  );
}
```

`BaseClient.putJson` already exists (used by `PollClient`) — no changes needed there.

### Step 2 — Controller method

Add a thin wrapper to `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js`
(base class shared by PC/NPC), delegating to the new client method the same way
`fetchCharacterFull`/`fetchCharacterTreasures` already do:

```js
updateCharacterMoney(gameSlug, characterId, token, money) {
  return this.characterClient.updateCharacterMoney(this.characterKind, gameSlug, characterId, token, money);
}
```

### Step 3 — `CharacterMoney` gets an optional edit link

This is the same presentational element used both on the show page (via `CharacterHelper`) and
on the edit page (via `CharacterMoneyField` → `MoneyEditModal` already lives there). The issue
requires wiring the new link only into the show-page usage, without touching the edit page's
existing modal — do this by adding two **optional** props, both unused/off by default so
`CharacterMoneyField`'s existing call site (`<CharacterMoney money={...} gameType={...} />`,
no new props passed) is byte-for-byte unaffected:

`frontend/assets/js/components/resources/character/pages/elements/CharacterMoney.jsx`:

```jsx
export default function CharacterMoney({
  money, gameType = 'dnd', canEditMoney = false, onEditMoney,
}) {
  return CharacterMoneyHelper.render(money, gameType, canEditMoney, onEditMoney);
}
```

`.../elements/helpers/CharacterMoneyHelper.jsx`: extract the existing `dnd`/`deadlands`/generic
switch into a private helper (e.g. `#renderBreakdown`), then in `render`, append the edit
link/button only when `canEditMoney` is true:

```jsx
static render(money, gameType, canEditMoney = false, onEditMoney) {
  const breakdown = CharacterMoneyHelper.#renderBreakdown(money, gameType);
  if (!canEditMoney) return breakdown;
  return (
    <>
      {breakdown}
      <div>
        <button type="button" className="btn btn-link btn-sm p-0" onClick={onEditMoney}>
          {Translator.t('character_page.edit_money_button')}
        </button>
      </div>
    </>
  );
}
```

(Translation key added by the `translator` agent — see its plan file.)

### Step 4 — Wire the edit link + modal into the show page

`CharacterHelper.jsx` (`.../pages/helpers/CharacterHelper.jsx`): pass the two new props through
to `<CharacterMoney />`:

```jsx
<CharacterMoney
  money={character.money}
  gameType={character.game_type}
  canEditMoney={character.can_edit_money}
  onEditMoney={handlers.onOpenMoneyModal}
/>
```

`CharacterDetail.jsx` (`.../pages/shared/CharacterDetail.jsx`, shared by both PC and NPC show
pages): add modal state/handlers analogous to the existing `showUploadModal` pattern, and render
`MoneyEditModal` (already used on the edit page, `frontend/assets/js/components/common/MoneyEditModal.jsx`)
alongside the existing `PhotoUploadModal`:

```jsx
const [showMoneyModal, setShowMoneyModal] = useState(false);

const handleMoneyConfirm = (newTotal) => {
  const token = AuthStorage.getToken(); // import from utils/auth/AuthStorage.js
  controller.updateCharacterMoney(gameSlug, character.id, token, newTotal)
    .then(() => {
      setShowMoneyModal(false);
      controller.buildEffect()();
    });
};

...

{CharacterHelper.render(character, backHref, {
  onOpenUploadModal: () => setShowUploadModal(true),
  onOpenMoneyModal: () => setShowMoneyModal(true),
  ...extraHandlers,
})}
...
<MoneyEditModal
  show={showMoneyModal}
  money={character?.money}
  context="character"
  gameType={character?.game_type}
  onClose={() => setShowMoneyModal(false)}
  onConfirm={handleMoneyConfirm}
/>
```

Add the `AuthStorage` and `MoneyEditModal` imports to `CharacterDetail.jsx` (mirror
`CharacterEdit.jsx`'s existing imports of the same modules).

Do not add anything to `NpcCharacter.jsx`'s `useSlainExtra`/`useNoExtra` extension-hook
mechanism — this feature is identical for PCs and NPCs, so it belongs in the shared
`CharacterDetail.jsx`, not the per-kind extension hook.

## Files to Change

- `frontend/assets/js/client/CharacterClient.js` — add `updateCharacterMoney`
- `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js` — add `updateCharacterMoney` wrapper
- `frontend/assets/js/components/resources/character/pages/elements/CharacterMoney.jsx` — add `canEditMoney`/`onEditMoney` props
- `frontend/assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyHelper.jsx` — render the optional edit link
- `frontend/assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx` — pass new props through
- `frontend/assets/js/components/resources/character/pages/shared/CharacterDetail.jsx` — money modal state/handler/reload

## CI Checks

- `frontend`: `docker-compose run frontend npm run coverage` (CI job: `jasmine`)
- `frontend`: `docker-compose run frontend npm run lint` (CI job: `frontend-checks`)

## Notes

- Do not touch `CharacterMoneyField.jsx`/`CharacterMoneyFieldHelper.jsx` (the edit-page usage) —
  it must keep calling `<CharacterMoney money={...} gameType={...} />` with no new props, so it
  renders exactly as before.
- New/updated specs, following this codebase's existing per-concern spec-splitting convention
  (see `specs/.../pages/helpers/CharacterHelper/*Spec.js` and
  `specs/.../pages/shared/CharacterEditMoneySpec.js`):
  - a new `CharacterHelper/moneyEditSpec.js`-style spec asserting the edit link only renders
    when `can_edit_money` is true, and calls the right handler
  - a `CharacterMoneyHelperSpec`/`CharacterMoneySpec` case for the new props (including the
    default/no-props case staying identical to today's output)
  - a `CharacterDetail`-level spec (new file, e.g. `CharacterDetailMoneySpec.js`) covering:
    opening the modal, PUT payload sent, modal closes and `buildEffect` reruns on success
