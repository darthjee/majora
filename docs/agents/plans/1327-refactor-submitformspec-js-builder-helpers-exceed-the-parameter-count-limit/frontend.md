# Frontend Plan: Refactor: submitFormSpec.js builder helpers exceed the parameter-count limit

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Group shared character fields into a `characterFields` sub-object

In `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterEditController/submitFormSpec.js`:

- Change `buildSubmitFields`'s signature from 9 top-level destructured params to `({ characterFields, links })`, where `characterFields` destructures `{ name, role, description, privateAllegiance, publicAllegiance, publicSlain, hidden, incognito }` internally (or is spread/read via `characterFields.name` etc. — match the file's existing destructuring style).
- Change `buildExpectedFields`'s signature from 10 top-level destructured params to `({ kind, characterFields, links })`, destructuring the same 8 fields from `characterFields` internally.
- Update both functions' JSDoc (`@param`) blocks to document `characterFields` as a single object param with its own nested field docs, instead of 8 separate `@param` lines each.
- Update the two call sites inside the `"prevents default, resets status/errors, and submits the built fields payload"` test (currently around lines 120–121 and 133–136) to build a `characterFields` object literal — using shorthand property names from the fields already destructured off the `KINDS` fixture in the `KINDS.forEach(({ ... }) => { ... })` callback — and pass it to both builders alongside their other params (`links`, and `kind` for `buildExpectedFields`).
- Leave `support.js`'s `KINDS` fixture and the `KINDS.forEach` destructuring unchanged — this refactor is scoped to `submitFormSpec.js` only.
- Leave the second test (`"does not throw when called without an event"`) unchanged — it doesn't use either builder.

## Files to Change

- `frontend/specs/assets/js/components/resources/character/pages/controllers/CharacterEditController/submitFormSpec.js` — regroup `buildSubmitFields`/`buildExpectedFields` params into a shared `characterFields` sub-object; update JSDoc and the two call sites accordingly.

## CI Checks

- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes

- Purely a test-file refactor — no production code changes, no behavior change. The two existing assertions in the affected test must still pass unchanged.
- Verify parameter counts land under Codacy's 8-parameter limit: `buildSubmitFields({ characterFields, links })` = 2 top-level params, `buildExpectedFields({ kind, characterFields, links })` = 3 top-level params.
