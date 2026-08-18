# Issue: Replace inline empty functions with the shared Noop.noop helper

## Description
Codacy (ESLint `@typescript-eslint/no-empty-function`) flags 53 inline empty functions (e.g. `() => {}`, `applyLoadedItem() {}`) across 46 files, almost all in Jasmine specs under `frontend/specs/`.

This project already has a shared helper for exactly this case: `frontend/assets/js/utils/Noop.js`, a class exposing a static `Noop.noop()`. It exists specifically to satisfy `frontend/eslint.config.mjs`'s `'no-empty-function': 'error'` rule (its own definition carries an `// eslint-disable-next-line no-empty-function` to work around the rule it exists to avoid triggering elsewhere), and dozens of other specs already import and use it (e.g. `frontend/specs/support/controllerStubs.js`).

Note: `frontend/assets/js/utils/Noop.js:12` itself appears in the Codacy findings below (the disable comment doesn't suppress Codacy's own scan) — that's expected and should be left as-is, not "fixed."

## Solution
Two mechanical fixes cover all 53 occurrences (excluding `Noop.js` itself, which stays as-is — see note above):

### 1. Never-resolving `Promise` executors (majority of occurrences)
Occurrences like `new Promise(() => {})` (including through wrappers like `const neverResolves = () => new Promise(() => {})`) become `new Promise(Noop.noop)`, matching the pattern already used at `frontend/specs/assets/js/utils/access/AccessCacheSpec.js:108`.

### 2. Class method stubs (`applyLoadedCharacter() {}`, `applyLoadedItem() {}`, `submitForm() {}`)
These are defined on `FakeController`/`LoadedController`-style test doubles across 13 of the 46 files (20 of the 53 occurrences). Several specs later do `spyOn(SomeController.prototype, 'methodName')` on these same classes (e.g. `CharacterEditSpec.js:208`, `CharacterEditLinksSpec.js:130`, `GameFactionEditSpec.js:94`, and 6 more) — `spyOn` requires the method to exist directly on the prototype. A class-field reassignment (`applyLoadedCharacter = Noop.noop;`) would move the method to the instance and break those spies, so these must stay as prototype methods with a non-empty body that delegates to the helper instead:

```js
applyLoadedCharacter() { Noop.noop(); }
```

In every modified file, import `Noop` from `frontend/assets/js/utils/Noop.js` (relative path per file), matching the existing import style already used in files like `controllerStubs.js` and `CharacterEditSpec.js`.

The occurrence list below (from the original Codacy scan) is treated as authoritative for implementation — no re-verification against a fresh lint run before starting.

## Occurrences (53, across 46 files)

- `frontend/assets/js/utils/Noop.js`
  - line 12: Unexpected empty static method 'noop'.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/AcquireDocumentTabSpec.js`
  - line 15: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/AcquireItemTabSpec.js`
  - line 15: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/AcquirePossessionTabSpec.js`
  - line 15: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/AcquireTreasureTabSpec.js`
  - line 17: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/BuyTreasureTabSpec.js`
  - line 17: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/RemoveDocumentTabSpec.js`
  - line 15: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/RemoveItemTabSpec.js`
  - line 15: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/RemovePossessionTabSpec.js`
  - line 15: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/RemoveTreasureTabSpec.js`
  - line 17: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/SellTreasureTabSpec.js`
  - line 17: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireDocumentTabController/confirmAcquireSpec.js`
  - line 23: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireItemTabController/confirmAcquireSpec.js`
  - line 23: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquirePossessionTabController/confirmAcquireSpec.js`
  - line 23: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/AcquireTreasureTabController/confirmAcquireSpec.js`
  - line 28: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/BuyTreasureTabController/confirmBuySpec.js`
  - line 28: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveDocumentTabController/confirmRemoveSpec.js`
  - line 23: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveItemTabController/confirmRemoveSpec.js`
  - line 23: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/RemovePossessionTabController/confirmRemoveSpec.js`
  - line 23: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/RemoveTreasureTabController/confirmRemoveSpec.js`
  - line 27: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/elements/tabs/controllers/SellTreasureTabController/confirmSellSpec.js`
  - line 27: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditEditorKindSpec.js`
  - line 19: Unexpected empty method 'applyLoadedCharacter'.
  - line 21: Unexpected empty method 'submitForm'.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditLinksSpec.js`
  - line 25: Unexpected empty method 'applyLoadedCharacter'.
  - line 27: Unexpected empty method 'submitForm'.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditMoneySpec.js`
  - line 24: Unexpected empty method 'applyLoadedCharacter'.
  - line 26: Unexpected empty method 'submitForm'.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditNpcAccessGuardSpec.js`
  - line 20: Unexpected empty method 'applyLoadedCharacter'.
  - line 22: Unexpected empty method 'submitForm'.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditPcAccessGuardSpec.js`
  - line 20: Unexpected empty method 'applyLoadedCharacter'.
  - line 22: Unexpected empty method 'submitForm'.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditSpec.js`
  - line 18: Unexpected empty method 'applyLoadedCharacter'.
  - line 20: Unexpected empty method 'submitForm'.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterEditTreasureValueSpec.js`
  - line 16: Unexpected empty method 'applyLoadedCharacter'.
  - line 18: Unexpected empty method 'submitForm'.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterItemEditSpec.js`
  - line 28: Unexpected empty method 'applyLoadedItem'.
- `frontend/specs/assets/js/components/resources/character/pages/shared/CharacterPossessionEditSpec.js`
  - line 30: Unexpected empty method 'applyLoadedItem'.
- `frontend/specs/assets/js/components/resources/document/pages/elements/GiveDocumentModalSpec.js`
  - line 14: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/document/pages/elements/controllers/GiveDocumentModalController/loadPageSpec.js`
  - line 9: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/document/pages/elements/controllers/GiveDocumentModalController/submitSpec.js`
  - line 26: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/faction/pages/GameFactionEditSpec.js`
  - line 26: Unexpected empty method 'applyLoadedItem'.
- `frontend/specs/assets/js/components/resources/game/pages/GameEditLinksSpec.js`
  - line 24: Unexpected empty method 'submitForm'.
- `frontend/specs/assets/js/components/resources/game_session/pages/controllers/SessionMessagesControllerSpec.js`
  - line 145: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/item/pages/GameItemEditSpec.js`
  - line 24: Unexpected empty method 'applyLoadedItem'.
- `frontend/specs/assets/js/components/resources/item/pages/elements/GiveItemModalSpec.js`
  - line 14: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController/loadPageSpec.js`
  - line 9: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/item/pages/elements/controllers/GiveItemModalController/submitSpec.js`
  - line 23: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/possession/pages/GamePossessionEditSpec.js`
  - line 28: Unexpected empty method 'applyLoadedItem'.
- `frontend/specs/assets/js/components/resources/treasure/pages/elements/AddGameTreasureModalSpec.js`
  - line 12: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/treasure/pages/elements/GiveTreasureModalSpec.js`
  - line 14: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController/loadPageSpec.js`
  - line 9: Unexpected empty arrow function.
- `frontend/specs/assets/js/components/resources/treasure/pages/elements/controllers/GiveTreasureModalController/submitSpec.js`
  - line 23: Unexpected empty arrow function.
- `frontend/specs/assets/js/utils/requests/RequestStoreLoggingSpec.js`
  - line 26: Unexpected empty arrow function.

## Benefits
- Passes the Codacy/ESLint `no-empty-function` check across all 53 flagged occurrences (except `Noop.js`'s own definition, which is expected to keep triggering it).
- Reuses the existing shared `Noop.noop` helper instead of scattering more `// eslint-disable-next-line no-empty-function` comments.
- Preserves existing spy-based test behavior: prototype methods that specs spy on via `spyOn(SomeController.prototype, 'methodName')` remain spy-able.
