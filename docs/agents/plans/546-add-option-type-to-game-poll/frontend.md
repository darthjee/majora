# Frontend Plan: Add option type to Game Poll

Main plan: [plan.md](plan.md)

## Shared contracts

- `createPoll` payload gains a top-level `option_type` field (`'text'` or `'date'`, default
  `'text'`), sibling to `type`. `PollClient.createPoll` already forwards the raw `fields` object
  as-is (`this.postJson(...)`), so only its JSDoc needs updating — no behavioral change there.
- The fetched poll detail object (from `GamePollController#fetchPoll`) already passes through
  whatever the backend returns unmodified, so `poll.option_type` will be available to
  `GamePollHelper` with no controller change.
- Depends on translation keys from the translator plan: `game_poll_new_page.option_type_label`,
  `option_type_text`, `option_type_date`.

## Implementation Steps

### Step 1 — Shared type-aware option components

Add a small `elements/` module pair, colocated with the other Poll-specific pieces in
`frontend/assets/js/components/resources/game/pages/elements/` (alongside `PollFilters.jsx`,
`OpenPollsWidget.jsx`). These are simple presentational components with no internal state —
follow the plain-function style of `FormField.jsx`/`TextareaField.jsx`, not the
controller/helper split used by the stateful widgets in this folder.

- `PollOptionType.js` — exports the type constants and a renderer registry keyed by type, e.g.
  `OPTION_TYPE_TEXT = 'text'`, `OPTION_TYPE_DATE = 'date'`. This is the single place that lists
  the known option types, so adding a new one later means adding one entry here plus one `case`
  in each of the two components below — not touching the form or the detail page.
- `PollOptionInput.jsx` — props: `{ id, dataTestId, optionType, value, onChange }`. Renders a
  plain `<input type="text">` for `text` (current behavior) and a native
  `<input type="date">` for `date`; falls back to text for any unrecognized type.
- `PollOptionValue.jsx` — props: `{ optionType, value }`. Renders `value` as-is for `text`; for
  `date`, formats it as a proper date. Parse the `YYYY-MM-DD` string by its component parts (year/
  month/day) rather than `new Date(value)`/`toLocaleDateString()` directly — the latter parses as
  UTC midnight and can render as the previous day in negative-UTC-offset timezones. Falls back to
  raw text for any unrecognized type.

### Step 2 — New Poll form: option type select

In `GamePollNew.jsx`:
- Add `const [optionType, setOptionType] = useState(GamePollNewHelper.OPTION_TYPE_TEXT)` (or
  import the constant from `PollOptionType.js`).
- Pass `optionType` into `formState` and add an `onOptionTypeChange` handler, mirroring the
  existing `type`/`onTypeChange` wiring.
- Include `option_type: optionType` in the `formValues` object passed to
  `controller.submitForm`.

In `GamePollNewHelper.jsx`:
- Add `#renderOptionTypeField`, a `<select>` (not radios, to keep it compact) listing `text` and
  `date`, placed **after** the Description field and **before** the existing `#renderTypeField`
  (poll type radios), per the issue. Labels via new `Translator.t('game_poll_new_page.option_type_label')`
  / `option_type_text` / `option_type_date` keys.
- In `#renderOption`, replace the hardcoded `<input type="text">` with
  `<PollOptionInput id={...} dataTestId={...} optionType={formState.optionType} value={option} onChange={...} />`.

In `GamePollNewController.js`:
- `submitForm`'s request body already spreads `formValues` selectively — add
  `option_type: formValues.option_type` to the `pollClient.createPoll` call.

### Step 3 — Poll detail page: type-aware display

In `GamePollHelper.jsx#renderOptions`, replace
`<li key={option.id} ...>{option.option}</li>` with
`<li key={option.id} ...><PollOptionValue optionType={poll.option_type} value={option.option} /></li>`
— thread `poll.option_type` down from `render(poll)` into `#renderOptions(options, poll.option_type)`.

### Step 4 — Client JSDoc

Update `PollClient.js#createPoll`'s JSDoc `fields` param to document the new
`fields.option_type` (`'text'` or `'date'`, optional, defaults server-side to `'text'`).

### Step 5 — Tests

- New specs: `PollOptionInputSpec.js`, `PollOptionValueSpec.js` under
  `frontend/specs/assets/js/components/resources/game/pages/elements/`, covering both types plus
  the unrecognized-type fallback, and the date-formatting edge case (no off-by-one day).
- `GamePollNewHelperSpec.js` — cover the new select rendering and default selection.
- `GamePollNewSpec.js` — cover `option_type` flowing into the submit payload.
- `GamePollHelperSpec.js` — cover a `date`-type poll rendering formatted option values, and a
  `text`-type poll rendering them unchanged (existing behavior).

## Files to Change

- `frontend/assets/js/components/resources/game/pages/elements/PollOptionType.js` — new: type constants + registry.
- `frontend/assets/js/components/resources/game/pages/elements/PollOptionInput.jsx` — new: type-aware option input.
- `frontend/assets/js/components/resources/game/pages/elements/PollOptionValue.jsx` — new: type-aware option display.
- `frontend/assets/js/components/resources/game/pages/GamePollNew.jsx` — add `optionType` state and pass-through.
- `frontend/assets/js/components/resources/game/pages/helpers/GamePollNewHelper.jsx` — add the select field; use `PollOptionInput` in `#renderOption`.
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollNewController.js` — include `option_type` in the create payload.
- `frontend/assets/js/components/resources/game/pages/helpers/GamePollHelper.jsx` — use `PollOptionValue` in `#renderOptions`.
- `frontend/assets/js/client/PollClient.js` — JSDoc update only.
- New/updated specs listed in Step 5.

## CI Checks

- `frontend`: `npm test` (CI job: `jasmine`).
- `frontend`: `npm run lint` (CI job: `Check JS Lint`).

## Notes

- Do not add `option_type` to `PollListSerializer`/the polls list page — out of scope, list view
  doesn't render options.
- No date-formatting utility currently exists anywhere in the frontend (verified — no
  date-fns/moment/dayjs/luxon dependency, no existing formatter component); `PollOptionValue` is
  the first one, so keep its date-parsing/formatting logic self-contained rather than reaching
  for a library.
