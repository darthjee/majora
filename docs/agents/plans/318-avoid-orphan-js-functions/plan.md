# Plan: Avoid orphan JS functions

Issue: [318-avoid-orphan-js-functions.md](../issues/318-avoid-orphan-js-functions.md)

## Overview

The frontend has ~27 page-controller files that each duplicate a small
`getXFromHash(hash)`-style module-scope function (mostly wrappers around
`Router.extractParams`), plus a handful of other orphan functions in
`hashQueryParams.js`, `CoinBreakdown.js`, `Route.js`, `Translator.js`,
`CharacterCardHelper.jsx`, `HeaderController.js`, and
`BaseCharacterEditController.js`. This plan converts all of them into
class/static methods, consolidating the repeated hash-parsing pattern into one
shared implementation on `BasePageController`, and updates every affected spec
to match. This is entirely frontend work — no backend, infra, proxy, or
translation changes are needed.

## Context

See the issue for the full inventory. In short:

1. 26 page controllers under `frontend/assets/js/components/pages/controllers/`
   export a module-scope `getXFromHash`/`getXParamsFromHash` function, each a
   thin wrapper around `Router.extractParams(pattern, hash)` that extracts one
   or more named params with a `?? ''` fallback.
2. `BaseCharacterEditController.js` additionally exports a heavier orphan
   function, `resolveLoadedCharacter(character)`.
3. `frontend/assets/js/utils/hashQueryParams.js` exports a single top-level
   function with no class at all.
4. `frontend/assets/js/utils/CoinBreakdown.js` exports `cascadeStep()` (plus an
   unexported `assertValidThreshold()`) alongside the `CoinBreakdown` class.
5. Four files have unexported, single-use, module-scope helpers next to the one
   class that uses them: `frontend/assets/js/utils/Route.js` (`escapeRegex`),
   `frontend/assets/js/i18n/Translator.js` (`lookup`),
   `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx`
   (`buildOverlayClickHandler`), and
   `frontend/assets/js/components/elements/controllers/HeaderController.js`
   (`defaultEventTarget`).

React function components under `components/elements/*.jsx` and
`components/pages/*.jsx` are out of scope (idiomatic React pattern), as is
`frontend/scripts/check_i18n.js` (a Node dev/CI script, not shipped app code).

## Implementation Steps

### Step 1 — Add a shared hash-param extraction helper to `BasePageController`

In `frontend/assets/js/components/pages/controllers/BasePageController.js`,
import `Router` and add two static methods:

```js
/**
 * Extract named params from a route pattern and hash, defaulting any
 * missing param to an empty string.
 *
 * @param {string} pattern - Route pattern (e.g. '/games/:game_slug').
 * @param {string} hash - Current hash.
 * @param {string[]} keys - Param names to extract.
 * @returns {object} Map of param name to string value.
 */
static extractParams(pattern, hash, keys) {
  const params = Router.extractParams(pattern, hash);

  return keys.reduce((acc, key) => ({ ...acc, [key]: params[key] ?? '' }), {});
}

/**
 * Extract a single named param from a route pattern and hash.
 *
 * @param {string} pattern - Route pattern.
 * @param {string} key - Param name to extract.
 * @param {string} hash - Current hash.
 * @returns {string} Extracted value, or '' when absent.
 */
static extractParam(pattern, key, hash) {
  return BasePageController.extractParams(pattern, hash, [key])[key];
}
```

This becomes the single implementation backing all 26 hash-parser
replacements below.

### Step 2 — Replace the 26 controller hash-parsers with static methods

For each of the 26 files listed under "Files to Change", remove the exported
module-scope `getXFromHash`/`getXParamsFromHash` function and replace it with
a `static` method on that file's own default-exported controller class (name
it the same as the removed function, e.g.
`GameController.getGameSlugFromHash(hash)`), implemented as a one-line
delegation to `BasePageController.extractParam(...)` (single param) or
`BasePageController.extractParams(...)` (multiple params). Update every
in-file usage (mainly inside `buildEffect()` and default constructor
parameters) to call `ThisClass.methodName(...)` instead of the removed
function.

Two structural details to watch:

- **Default constructor parameters referencing the extractor**: several
  files (e.g. `NpcCharacterController.js`, `PcCharacterController.js`,
  `CharacterController.js`) use the extractor function as a constructor
  default parameter value (`paramsFromHash = getNpcCharacterParamsFromHash`).
  Replace this with `paramsFromHash = NpcCharacterController.getParamsFromHash`
  (referencing the class's own static method) — this is safe because default
  parameters are evaluated at call time, after the class declaration has
  fully executed.
- **`RecoverPasswordController.js`** does not use `Router`/`BasePageController`
  at all — its `getRecoverPasswordTokenFromHash(hashQueryParams, hash)` wraps
  the `hashQueryParams` helper (see Step 3) instead. Convert it to a static
  method on `RecoverPasswordController` that takes the same two params, or
  simplify it to import `HashQueryParams` directly once Step 3 lands (either
  is acceptable; prefer removing the injected-function parameter if no test
  relies on overriding it — check the spec first).

### Step 3 — Convert `hashQueryParams.js` into a class

Turn `frontend/assets/js/utils/hashQueryParams.js`'s default-exported function
into a small class (e.g. `HashQueryParams`) with a static method (e.g.
`HashQueryParams.parse(hash)`), preserving the exact same parsing behavior.
Update every importer (grep for `hashQueryParams` under
`frontend/assets/js/` and `frontend/specs/`) to use the new class/static call.

### Step 4 — Move `CoinBreakdown.js`'s orphan functions onto the class

In `frontend/assets/js/utils/CoinBreakdown.js`, convert `assertValidThreshold`
and the exported `cascadeStep` into private/static methods of `CoinBreakdown`
(e.g. `CoinBreakdown.#assertValidThreshold` and
`CoinBreakdown.#cascadeStep`, called as `CoinBreakdown.#cascadeStep(...)`
from within `build()`). If `cascadeStep` is imported directly in
`CoinBreakdownSpec.js` for standalone testing, keep it reachable for tests
either by testing it indirectly through `build()`, or by exposing a
non-private static wrapper if direct unit coverage of the cascade math is
required — check the existing spec before deciding.

### Step 5 — Break up `resolveLoadedCharacter` in `BaseCharacterEditController.js`

Replace the exported `resolveLoadedCharacter(character)` function with two
smaller private static methods on `BaseCharacterEditController`, split by
responsibility, e.g.:

- `static #shouldRedirect(character)` — returns whether the character is
  missing or not editable.
- `static #fieldsFromCharacter(character)` — shapes the form-seed fields
  object from a loaded, editable character.

Update `applyLoadedCharacter(...)` (the only caller) to use these two methods
directly instead of destructuring `{ redirect, fields }` from the removed
function.

### Step 6 — Convert the four private per-file helpers into class methods

- `frontend/assets/js/utils/Route.js`: turn `escapeRegex(value)` into a
  private static method `Route.#escapeRegex(value)`, called from the
  constructor.
- `frontend/assets/js/i18n/Translator.js`: turn `lookup(map, key)` into a
  private static method `Translator.#lookup(map, key)`, called from `t()`.
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx`:
  turn `buildOverlayClickHandler(callback, character)` into a private static
  method `CharacterCardHelper.#buildOverlayClickHandler(...)`, called from
  `#renderPhoto(...)`.
- `frontend/assets/js/components/elements/controllers/HeaderController.js`:
  turn `defaultEventTarget()` into a private static method
  `HeaderController.#defaultEventTarget()`, used only as the default value
  for the `eventTarget` constructor parameter (`eventTarget =
  HeaderController.#defaultEventTarget()` — same "safe because evaluated at
  call time" reasoning as Step 2).

### Step 7 — Update every affected spec

For each converted file, update its spec(s) under
`frontend/specs/assets/js/...` to import the class instead of the removed
standalone function, and to call the new static/private-via-public-API
method instead. In particular:
- `frontend/specs/assets/js/components/pages/controllers/**/get*FromHashSpec.js`
  (one per controller, e.g. `GameController/getGameSlugFromHashSpec.js`) —
  update the import and call site to `GameController.getGameSlugFromHash(...)`
  (etc.), keeping the same assertions.
- `frontend/specs/assets/js/utils/hashQueryParamsSpec.js` — update to the new
  `HashQueryParams.parse(...)` call.
- `frontend/specs/assets/js/utils/CoinBreakdownSpec.js` — update per the
  decision made in Step 4.
- Any spec covering `resolveLoadedCharacter`, `Route`, `Translator`,
  `CharacterCardHelper`, or `HeaderController` — update to exercise the new
  methods/behavior, without losing coverage of the branches previously
  covered directly.

Run a full search (`grep -rn "getGameSlugFromHash\|getSessionParamsFromHash\|..."`,
or more simply grep each removed export name) across both `assets/` and
`specs/` before finishing, to make sure no stale import of a removed
module-scope export remains.

## Files to Change

Shared helper:
- `frontend/assets/js/components/pages/controllers/BasePageController.js` — add
  `extractParam`/`extractParams` static helpers (Step 1).

Controllers with a hash-parser to consolidate (Step 2):
- `frontend/assets/js/components/pages/controllers/GameController.js`
- `frontend/assets/js/components/pages/controllers/GameEditController.js`
- `frontend/assets/js/components/pages/controllers/GameNpcNewController.js`
- `frontend/assets/js/components/pages/controllers/GameNpcsController.js`
- `frontend/assets/js/components/pages/controllers/GamePcsController.js`
- `frontend/assets/js/components/pages/controllers/GamePhotosController.js`
- `frontend/assets/js/components/pages/controllers/GameSessionController.js`
- `frontend/assets/js/components/pages/controllers/GameSessionEditController.js`
- `frontend/assets/js/components/pages/controllers/GameSessionNewController.js`
- `frontend/assets/js/components/pages/controllers/GameSessionsController.js`
- `frontend/assets/js/components/pages/controllers/GameTreasureEditController.js`
- `frontend/assets/js/components/pages/controllers/GameTreasureNewController.js`
- `frontend/assets/js/components/pages/controllers/GameTreasuresController.js`
- `frontend/assets/js/components/pages/controllers/NpcCharacterController.js`
- `frontend/assets/js/components/pages/controllers/NpcCharacterEditController.js`
- `frontend/assets/js/components/pages/controllers/NpcCharacterPhotosController.js`
- `frontend/assets/js/components/pages/controllers/NpcCharacterTreasuresController.js`
- `frontend/assets/js/components/pages/controllers/PcCharacterController.js`
- `frontend/assets/js/components/pages/controllers/PcCharacterEditController.js`
- `frontend/assets/js/components/pages/controllers/PcCharacterPhotosController.js`
- `frontend/assets/js/components/pages/controllers/PcCharacterTreasuresController.js`
- `frontend/assets/js/components/pages/controllers/RecoverPasswordController.js`
- `frontend/assets/js/components/pages/controllers/StaffUserController.js`
- `frontend/assets/js/components/pages/controllers/StaffUserEditController.js`
- `frontend/assets/js/components/pages/controllers/TreasureController.js`
- `frontend/assets/js/components/pages/controllers/TreasureEditController.js`

Heavier orphan function (Step 5):
- `frontend/assets/js/components/pages/controllers/BaseCharacterEditController.js`

Other orphan functions/utilities (Steps 3, 4, 6):
- `frontend/assets/js/utils/hashQueryParams.js`
- `frontend/assets/js/utils/CoinBreakdown.js`
- `frontend/assets/js/utils/Route.js`
- `frontend/assets/js/i18n/Translator.js`
- `frontend/assets/js/components/elements/helpers/CharacterCardHelper.jsx`
- `frontend/assets/js/components/elements/controllers/HeaderController.js`

Specs (Step 7) — one file per controller above under
`frontend/specs/assets/js/components/pages/controllers/<Controller>/`
(pattern: `get*FromHashSpec.js`), plus:
- `frontend/specs/assets/js/utils/hashQueryParamsSpec.js`
- `frontend/specs/assets/js/utils/CoinBreakdownSpec.js`
- any existing specs for `Route.js`, `Translator.js`, `CharacterCardHelper.jsx`,
  `HeaderController.js`, and `BaseCharacterEditController.js`'s
  `resolveLoadedCharacter` behavior.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`, `npm run lint`)
- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`, `npm run coverage`)

## Notes

- Do not touch React function components (`components/elements/*.jsx`,
  `components/pages/*.jsx`) or `frontend/scripts/check_i18n.js` — both are
  explicitly out of scope per the issue.
- Prefer `#private` static methods for helpers that are only ever used
  internally by their own class (Steps 4, 5, 6); prefer plain `static` methods
  for the hash-parsers (Step 2), since those are directly unit-tested from
  spec files and used as default constructor parameter values across class
  boundaries (e.g. `NpcCharacterController` passing its extractor down into
  `CharacterController`).
- Watch for circular-looking self-references in default parameters
  (`paramsFromHash = ClassName.staticMethod`, `eventTarget =
  ClassName.#privateStaticMethod()`) — these are valid JS because default
  parameter expressions are evaluated when the constructor is called, not
  when the class body is parsed.
- This is a pure refactor: no behavior should change. Every existing spec
  assertion should still hold after the corresponding call site is updated to
  the new class/static method.
