# Frontend Plan: Replace inline empty functions with the shared Noop.noop helper

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Never-resolving `Promise` executors (32 files, 32 occurrences)

Every occurrence in this category is a `new Promise(() => {})` (a promise that intentionally never settles, used to keep a component/controller in a "pending" state for the spec), sometimes wrapped in a named helper like `const neverResolves = () => new Promise(() => {})`. Replace the empty executor with the already-established pattern:

```js
// before
new Promise(() => {})
// after
new Promise(Noop.noop)
```

This exact pattern is already used at `frontend/specs/assets/js/utils/access/AccessCacheSpec.js:108` — no new convention is introduced.

For each file below: add `import Noop from '<relative-path-to>/assets/js/utils/Noop.js';` (match the relative-path depth already used by sibling imports in that file — see `CharacterEditSpec.js`'s `import Noop from '../../../../../../../../assets/js/utils/Noop.js';` for the style), then replace the flagged `() => {}` with `Noop.noop`. Do not add unused imports — several of these files already import `Noop` for other occurrences (see the Step 2 file list) and don't need a second import.

Files (exact line numbers are in the issue's [Occurrences](../../issues/1150-replace-inline-empty-functions-with-the-shared-noop-noop-helper.md#occurrences-53-across-46-files) list):

- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/AcquireDocumentTabSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/AcquireItemTabSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/AcquirePossessionTabSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/AcquireTreasureTabSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/BuyTreasureTabSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/RemoveDocumentTabSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/RemoveItemTabSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/RemovePossessionTabSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/RemoveTreasureTabSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/SellTreasureTabSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireDocumentTabController/confirmAcquireSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireItemTabController/confirmAcquireSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquirePossessionTabController/confirmAcquireSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireTreasureTabController/confirmAcquireSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/BuyTreasureTabController/confirmBuySpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveDocumentTabController/confirmRemoveSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveItemTabController/confirmRemoveSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/RemovePossessionTabController/confirmRemoveSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveTreasureTabController/confirmRemoveSpec.js`
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/SellTreasureTabController/confirmSellSpec.js`
- `frontend/specs/assets/js/components/resources/document/pages/elements/GiveDocumentModalSpec.js`
- `frontend/specs/assets/js/components/resources/document/pages/elements/controllers/GiveDocumentModalController/loadPageSpec.js`
- `frontend/specs/assets/js/components/resources/document/pages/elements/controllers/GiveDocumentModalController/submitSpec.js`
- `frontend/specs/assets/js/components/resources/game_session/pages/controllers/SessionMessagesControllerSpec.js`
- `frontend/specs/assets/js/components/resources/item/pages/elements/GiveItemModalSpec.js`
- `frontend/specs/assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController/loadPageSpec.js`
- `frontend/specs/assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController/submitSpec.js`
- `frontend/specs/assets/js/components/resources/treasure/pages/elements/AddGameTreasureModalSpec.js`
- `frontend/specs/assets/js/components/resources/treasure/pages/elements/GiveTreasureModalSpec.js`
- `frontend/specs/assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController/loadPageSpec.js`
- `frontend/specs/assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController/submitSpec.js`
- `frontend/specs/assets/js/utils/requests/RequestStoreLoggingSpec.js`

### Step 2 — Class method stubs (13 files, 20 occurrences)

These are `applyLoadedCharacter() {}`, `applyLoadedItem() {}`, and `submitForm() {}` stubs defined on local `FakeController`/`LoadedController`-style test doubles. Several of these files later do `spyOn(SomeController.prototype, 'methodName')` on the very same class (e.g. `CharacterEditSpec.js:208` spies on `LoadedController.prototype.applyLoadedCharacter`; similarly `CharacterEditLinksSpec.js:130`, `CharacterEditEditorKindSpec.js:125`, `CharacterItemEditSpec.js:104`, `CharacterPossessionEditSpec.js:107`, `GameFactionEditSpec.js:94`, `GameEditLinksSpec.js:88`, `GameItemEditSpec.js:94`, `GamePossessionEditSpec.js:98` spy on `submitForm`). `spyOn` requires the property to exist directly on the object passed to it — since `.prototype` is passed explicitly, the method must stay a **prototype method**, not become a class field. A class-field reassignment (`applyLoadedCharacter = Noop.noop;`) would move the property onto instances instead and break every one of those `spyOn(...prototype...)` calls.

Keep each stub as a method, with a body that delegates to the helper instead of being empty:

```js
// before
// eslint-disable-next-line no-empty-function
applyLoadedCharacter() {}

// after
applyLoadedCharacter() { Noop.noop(); }
```

(same shape for `applyLoadedItem` and `submitForm`). Remove the now-unnecessary `// eslint-disable-next-line no-empty-function` comment above each converted line. Add the `Noop` import per file (same relative-path convention as Step 1) if not already present — `CharacterEditSpec.js`, `CharacterEditLinksSpec.js`, and others already import `Noop` for their `buildEffect() { return () => Noop.noop; }` stub, so check per file before adding a duplicate import.

Files (exact line numbers are in the issue's Occurrences list):

- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditEditorKindSpec.js` — `applyLoadedCharacter`, `submitForm`
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditLinksSpec.js` — `applyLoadedCharacter`, `submitForm`
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditMoneySpec.js` — `applyLoadedCharacter`, `submitForm`
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditNpcAccessGuardSpec.js` — `applyLoadedCharacter`, `submitForm`
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditPcAccessGuardSpec.js` — `applyLoadedCharacter`, `submitForm`
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditSpec.js` — `applyLoadedCharacter`, `submitForm`
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditTreasureValueSpec.js` — `applyLoadedCharacter`, `submitForm`
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterItemEditSpec.js` — `applyLoadedItem`
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterPossessionEditSpec.js` — `applyLoadedItem`
- `frontend/specs/assets/js/components/resources/faction/pages/GameFactionEditSpec.js` — `applyLoadedItem`
- `frontend/specs/assets/js/components/resources/game/pages/GameEditLinksSpec.js` — `submitForm`
- `frontend/specs/assets/js/components/resources/item/pages/GameItemEditSpec.js` — `applyLoadedItem`
- `frontend/specs/assets/js/components/resources/possession/pages/GamePossessionEditSpec.js` — `applyLoadedItem`

### Step 3 — Verify

Do **not** touch `frontend/assets/js/utils/Noop.js` (its own `noop() {}` definition is the expected, permanent source of the 53rd occurrence).

Run, from `frontend/`:
- `npm run lint` — confirms all 52 fixed occurrences (53 minus `Noop.js`) no longer trigger `no-empty-function`, and that no new lint errors were introduced (unused imports, etc.).
- `npm test` — confirms the `spyOn(...prototype...)` assertions in the Step 2 files still pass, and that the never-resolving-`Promise` specs from Step 1 still behave as "stuck in loading" (no regression in resolved/rejected state).

## Files to Change

See the file lists under Step 1 and Step 2 above (46 files total). No other files are touched; `frontend/assets/js/utils/Noop.js` is explicitly excluded.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm test` (CI job: `jasmine`)

## Notes
- The occurrence list is treated as authoritative (per discussion) — no fresh lint re-scan before implementing. If the fixing agent finds the actual line numbers have drifted from the issue's list (files edited since the Codacy scan), fix based on the still-empty function itself, not the stale line number.
- Every file in Step 1 uses the identical `new Promise(() => {}) → new Promise(Noop.noop)` substitution — no per-file judgment needed there.
- Step 2's "keep as a prototype method calling `Noop.noop()`" rule applies uniformly to all 13 files, even though only 9 of them currently spy on the prototype — this avoids a fragile per-file split and keeps the fix consistent if future specs start spying on the others too.
