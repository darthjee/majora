# Avoid orphan JS functions

## Context

The frontend codebase is almost entirely class-based (Clients, Controllers, Helpers, and
utility classes under `frontend/assets/js/utils/`), but a number of files define standalone
("orphan") functions at module scope instead of as class members. This breaks the
established convention and spreads duplicated logic across many files.

Investigation found the following orphan functions, all in scope for this issue:

1. **Systemic pattern (27 files)** — every page controller under
   `frontend/assets/js/components/pages/controllers/` defines a small, pure
   `getXFromHash(hash)`-style function at module scope, next to (and used only by) that
   file's controller class (e.g. `GameController.js` → `getGameSlugFromHash`,
   `RecoverPasswordController.js` → `getRecoverPasswordTokenFromHash`). These appear to have
   been pulled out of the class purely for unit-testability, and the pattern is duplicated
   across all 27 files.
2. **Fully orphan utility files** — `frontend/assets/js/utils/hashQueryParams.js` exports a
   single top-level function with no class at all.
3. **Exported function beside a class in the same file** —
   `frontend/assets/js/utils/CoinBreakdown.js` exports `cascadeStep()` (and an unexported
   `assertValidThreshold()`) alongside the `CoinBreakdown` class.
4. **A heavier orphan function** — `BaseCharacterEditController.js`'s
   `resolveLoadedCharacter(character)` is a ~20-line function with multiple responsibilities
   (branching + object shaping).
5. **Private (unexported) top-level helpers inside otherwise class-based files** — small
   module-scope functions used only by one class in the same file: `Route.js`
   (`escapeRegex`), `Translator.js` (`lookup`), `CharacterCardHelper.jsx`
   (`buildOverlayClickHandler`), `HeaderController.js` (`defaultEventTarget`).

Out of scope: React function components (`export default function X()` across
`components/elements/*.jsx` and `components/pages/*.jsx`) are the idiomatic React pattern,
already paired with class-based `*Helper.jsx` companions where logic is non-trivial —
converting them to classes would go against convention, not align with it.
`frontend/scripts/check_i18n.js` is a Node dev/CI script outside `frontend/assets/js/`, not
shipped app code.

## What needs to be done

Frontend:

- **27 controller hash-parsers**: consolidate the repeated pattern into a shared class
  rather than fixing each file in isolation — e.g. add a generic `static`
  hash/param-extraction method to `BasePageController` (or a new small dedicated helper
  class), and have each controller call it instead of duplicating its own module-scope
  function.
- **`hashQueryParams.js` / `CoinBreakdown.js`**: turn the exported functions into static
  methods of an existing or new class in the same file (e.g. a `HashQueryParams` class; move
  `cascadeStep`/`assertValidThreshold` onto `CoinBreakdown` as private/static methods).
- **`resolveLoadedCharacter`**: break it into smaller static methods on
  `BaseCharacterEditController` (or a small dedicated class), one per responsibility
  (deciding redirect vs. seeding form fields).
- **Private per-file helpers** (`Route.js`, `Translator.js`, `CharacterCardHelper.jsx`,
  `HeaderController.js`): convert each into a private/static method of the class already in
  that file.

Across all of the above, existing unit tests (e.g. `GameControllerSpec`,
`RecoverPasswordControllerSpec`, `hashQueryParamsSpec`, `CoinBreakdownSpec`) must be updated
to exercise the new class/static methods instead of the standalone functions, without losing
coverage.

## Acceptance criteria

- [ ] All 27 controller hash-parser functions are replaced by calls to a shared class method
      instead of duplicated module-scope functions.
- [ ] `hashQueryParams.js` no longer exports a top-level function; its logic lives on a class.
- [ ] `CoinBreakdown.js`'s `cascadeStep`/`assertValidThreshold` are private/static methods of
      `CoinBreakdown` rather than module-scope functions.
- [ ] `BaseCharacterEditController.js`'s `resolveLoadedCharacter` is broken into smaller
      static methods with single responsibilities.
- [ ] `Route.js`, `Translator.js`, `CharacterCardHelper.jsx`, and `HeaderController.js` no
      longer contain private top-level helper functions; the logic moves onto the existing
      class in each file.
- [ ] All affected unit tests are updated to cover the new class/static methods and continue
      to pass.
- [ ] ESLint passes with no new violations.

---
Tags: :shipit:
