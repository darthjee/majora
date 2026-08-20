# Issue: Refactor Header/Account components flagged as too long (Lizard nloc-medium)

## Description

Sub-issue of #1167 (itself a sub-issue of #1152). Codacy's `Lizard` complexity analyzer originally flagged 4 methods across 4 files under `frontend/assets/js/components/common/header/` and `frontend/assets/js/components/resources/account/` as exceeding the 50-NLOC-per-method limit. One of the 4 (`HeaderHelper#renderAuthControl`) has since been resolved as a side effect of #1186 (config-driven registry for Header's controls). This issue now covers the remaining 3, re-verified against the current codebase (`lizard`) before drafting the solution below:

| File / method | Originally flagged | Current NLOC | Status |
|---|---|---|---|
| `Header.jsx` (`Header`) | 51 | 51 | still over — in scope |
| `HeaderHelper.jsx` (`#renderAuthControl`) | 70 | 6 | already resolved by #1186 — dropped from scope |
| `LoginModal.jsx` (`LoginModal`) | 51 | 51 | still over — in scope |
| `MyAccountHelper.jsx` (`render`) | 63 | 63 | still over — in scope |

## Problem

These components mix several concerns (hook/state/effect wiring, handler-building, or repeated near-identical markup blocks) in one long method, making them harder to read and maintain.

## Expected Behavior

Each method below drops back under its 50-NLOC limit through genuine sub-responsibility extraction, following the project's existing patterns (custom hooks, controller-owned handler methods, config-driven registries), per the Definition of Done strengthened in #1152.

## Solution

For each occurrence, identify the distinct sub-responsibilities being mixed together and extract them into well-named helper methods, controller methods, custom hooks, or config-driven registries — whichever fits the file's existing structure.

### `Header.jsx` — `Header` (51 NLOC)

Unlike a Helper's `render`, `Header` already delegates markup to `HeaderHelper`; its bulk is hook/state wiring, not JSX. Two extractions, done together (needed to clear the limit comfortably):

- Extract the ~34-line `useEffect` (status check, `AuthEvents`/`AccessEvents` listeners, route effect, cleanup) into a custom hook, e.g. `useHeaderAuthEffect`, following the existing custom-hooks convention already used under `frontend/assets/js/components/resources/character/pages/shared/hooks/`.
- Move the handlers-object literal currently built inline and passed to `HeaderHelper.render` (the `onLoginClick`/`onLogoffClick`/... block) onto `HeaderController` as a `buildHandlers(viewAsController)` method, keeping handler construction next to the controller methods it wraps.

### `LoginModal.jsx` — `LoginModal` (51 NLOC)

Handler-heavy in the same way, but `LoginModalController` already owns most of the component's setters (`setUsername`, `setPassword`, `setIncorrect`, `setError`, `setRecoverySent`, `setAuthorizeStatus`) — `mode`/`email` are the outliers still managed locally. Move the handler bulk onto the controller, consistent with `Header.jsx`'s controller-first direction above:

- Extend `LoginModalController` to also accept `setMode`/`setEmail`, and move `handleClear`/`handleClose`/`handleSubmit`/`handleRecoverSubmit`/`handleRegisterClick`/`handleAuthorizeSubmit`/`handleModeChange` onto it as methods (including deduping the 3×-repeated `event?.preventDefault()` guard as a private controller helper).
- `LoginModal.jsx` itself shrinks to state declarations, controller instantiation, and the delegate call to `LoginModalHelper.render`.

### `MyAccountHelper.jsx` — `render` (63 NLOC, CCN 15)

7 near-identical `<FormField>` blocks differing only by `id`/`type`/label key/value key/handler key/error key — the same shape `AUTH_CONTROL_REGISTRY` solved in #1186. Adopt a `FIELD_REGISTRY` array of `{id, type, labelKey, valueKey, onChangeKey, errorKey}` entries, mapped via `.map()`. This also collapses the 7 repeated `formState.fieldErrors.X ?? []` chains that inflate the current CCN. Avatar, heading, and the submit button stay outside the registry as unconditional markup, mirroring `HeaderHelper.render`'s brand/modals staying outside `AUTH_CONTROL_REGISTRY`.

### Occurrences (3, across 3 files)

- `frontend/assets/js/components/common/header/Header.jsx`
  - line 22: Method Header has 51 lines (limit 50)
- `frontend/assets/js/components/resources/account/LoginModal.jsx`
  - line 12: Method LoginModal has 51 lines (limit 50)
- `frontend/assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx`
  - line 25: Method render has 63 lines (limit 50)

### Testing / regression safety

Pure structural refactor, no behavior change. Existing specs (`HeaderSpec.js`, `LoginModalSpec.js`, `MyAccountHelper`'s specs) assert on rendered output via `data-testid`, not implementation details, so a passing suite with unchanged coverage is the regression signal — mirrors #1167's testing approach for the sibling sub-issues. New specs are additive: `FIELD_REGISTRY` id-uniqueness (mirroring `AUTH_CONTROL_REGISTRY`'s own uniqueness spec), and coverage for the new `useHeaderAuthEffect` hook and the handler methods moved onto `HeaderController`/`LoginModalController`.

### Out of scope

Permissions, new edge cases, and performance/security considerations don't apply here: no new endpoints, no auth/permission-logic change, and no behavior change — this is a pure render/effect-wiring structural refactor of already-covered code paths.

## Benefits

Improved readability, reusability, and testability of the header/auth components; passes the Codacy Lizard check.
