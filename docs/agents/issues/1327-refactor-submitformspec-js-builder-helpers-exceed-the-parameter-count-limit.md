# Issue: Refactor: submitFormSpec.js builder helpers exceed the parameter-count limit

## Description
Codacy's Lizard `parameter-count-medium` check (max 8 parameters) flags two test-builder helpers in `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterEditController/submitFormSpec.js`:

- `buildSubmitFields` (line 21) — 9 parameters (`name, role, description, privateAllegiance, publicAllegiance, publicSlain, hidden, incognito, links`)
- `buildExpectedFields` (line 56) — 10 parameters (`kind, name, role, description, links, privateAllegiance, publicAllegiance, publicSlain, hidden, incognito`)

Both already take a single destructured options object each, so this is purely a "too many fields in one options object" issue, not a positional-argument one.

## Problem
The two helpers duplicate the same 8 core character fields (`name, role, description, privateAllegiance, publicAllegiance, publicSlain, hidden, incognito`) as separate top-level destructured params, which pushes both over Codacy's 8-parameter limit and makes the shared shape harder to see at a glance.

## Solution
Group the 8 fields shared by both builders into a single `characterFields` sub-object, so each helper's own extra params (`links`, and `kind` for `buildExpectedFields`) sit alongside it:

- `buildSubmitFields({ characterFields, links })` — 2 top-level params
- `buildExpectedFields({ kind, characterFields, links })` — 3 top-level params

Update the JSDoc for both helpers and the two call sites in the "prevents default, resets status/errors, and submits the built fields payload" test to build a `characterFields` object literal (via shorthand, from the fields already destructured off the `KINDS` fixture) and pass it through. No production code changes — this is scoped to `submitFormSpec.js` only; the `KINDS` fixture in `support.js` and the `KINDS.forEach` destructuring stay as they are.

## Benefits
Brings both helpers back under Codacy's 8-parameter limit without changing test behavior or coverage.
