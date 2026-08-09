# Frontend Plan: Review validation errors for better validations

Main plan: [plan.md](plan.md)

## Shared contracts

- Backend now returns **codes**, not message text, inside `{'errors': {field_or_detail: [code,
  ...]}}` — every code the frontend receives must resolve via `Translator.t(\`errors.${code}\`,
  code)` (falling back to the raw code if a translation entry is ever missing, rather than
  crashing).
- `translator` is adding one `errors.<code>` entry per code to `en.yaml`/`pt.yaml` — see
  [translator.md](translator.md) — the full code list comes from `backend.md`'s Step 3/4.
- Non-field errors arrive under the `'detail'` key of the same `errors` object, same as today.

## Implementation Steps

### Step 1 — Translate field-level errors

Update `frontend/assets/js/components/common/forms/FieldErrors.jsx` so each entry in `errors` is
resolved through `Translator.t(\`errors.${code}\`, code)` before rendering, instead of rendering
the raw string directly. `errors` now holds codes (e.g. `'max_length'`, `'session_wrong_game'`),
not display text.

### Step 2 — Render non-field (`detail`) errors

In `frontend/assets/js/components/common/show_page/ShowPageLayout.jsx`, right before `body` is
returned (around the current line ~65), render the non-field alert when in `new`/`edit` mode and
`context.fieldErrors?.detail` has entries:

```jsx
{mode !== 'show' && context.fieldErrors?.detail?.length > 0 && (
  <ErrorAlert error={context.fieldErrors.detail.map(
    (code) => Translator.t(`errors.${code}`, code),
  ).join(' ')} />
)}
```

(`ErrorAlert` takes a single `error` string prop — join multiple detail messages with a space, or
adjust `ErrorAlert`/introduce a list-rendering variant if that reads awkwardly once real codes are
in place; use judgment during implementation.) Import `ErrorAlert` and `Translator` into
`ShowPageLayout.jsx`.

This is a single shared-layout change — no per-resource Heading/Helper needs its own non-field
error handling after this.

### Step 3 — Specs

- `specs/assets/js/components/common/forms/FieldErrorsSpec.js` — update/add cases asserting a code
  like `'max_length'` renders the translated text (or the fallback code when untranslated).
- `specs/assets/js/components/common/show_page/ShowPageLayoutSpec.js` — add cases: a `detail`
  error renders the alert in `new`/`edit` mode; no alert when `fieldErrors.detail` is absent/empty;
  no alert in `show` mode regardless of `fieldErrors`.

## Files to Change

- `frontend/assets/js/components/common/forms/FieldErrors.jsx`
- `frontend/assets/js/components/common/show_page/ShowPageLayout.jsx`
- `frontend/specs/assets/js/components/common/forms/FieldErrorsSpec.js`
- `frontend/specs/assets/js/components/common/show_page/ShowPageLayoutSpec.js`

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn test` (CI job: `jasmine`)
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)

## Notes

- Do not edit `frontend/assets/i18n/*.yaml` directly — that content is owned by the `translator`
  agent (see [translator.md](translator.md)). Coordinate the code list with it.
- Wait for (or coordinate in parallel with) `backend`'s final code list before finalizing which
  codes get referenced in specs, to avoid asserting on placeholder codes that change.
