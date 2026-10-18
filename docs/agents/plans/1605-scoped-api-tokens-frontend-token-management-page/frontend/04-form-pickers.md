# Scope picker, games picker and expiry

These are controlled form components for the create modal, placed under
`components/resources/account/pages/elements/` because they belong to the owner page only.

- **`ApiTokenScopePicker`** (`value: string[]`, `scopes: string[]` from `options.json`,
  `onChange`, `errors`):
  - A table with one row per family, grouped under the group headings (use `groupScopes` from
    step 03), and Read and Write checkbox columns.
  - Each row shows its `family_<f>_help` line, and the table ends with the `scopes_note`.
  - Only render checkboxes for scopes that exist in `options.json`.
  - Ticking Write also ticks Read. Read can still be unticked by hand.
  - Shortcuts: "Select all read", "Select all write" and "Clear". There is no "everything"
    shortcut.
  - Renders `<FieldErrors errors={errors.scopes} />`.
  - Keep the toggle logic in a small pure module (e.g. `ApiTokenScopeSelection.js`, with
    `toggle(value, scope, checked)`, `selectAll(scopes, action)` and `clear()`) so it can be
    tested without rendering.
- **`ApiTokenGamesPicker`** (`value: [{slug, name}]`, `options: {games, all_games}`, `onChange`,
  `errors`):
  - Reuse `MultiResourcePickerField` in constant mode, mapping games to `{id: slug, name}`.
    Pass `maxEntries` so the type-ahead can reach the whole bounded list.
  - **Cap:** export `MAX_GAMES = 100` (mirrors backend `GAMES_MAX_COUNT`). Once 100 are
    selected, block further additions: disable the search or ignore additions in `onChange`,
    whichever the field supports. Show the `games_limit` hint.
  - Below the picker, show notes:
    - when nothing is selected, the `games_empty_note` with `count = games.length`;
    - when nothing is selected and `all_games` is true, a yellow `alert-warning` with
      `games_superuser_warning`;
    - when there are no games at all, the `games_none_reachable` note.
  - Renders `<FieldErrors errors={errors.games} />`, which also covers the backend
    `max_length` error.
- **`ApiTokenExpiryField`** plus a pure `ApiTokenExpiry.js`:
  - Radio buttons for `30`, `90` (default), `custom` and `never`.
  - The custom option shows an `<input type="date" min={tomorrow}>`.
  - `never` shows the `expiry_never_hint`.
  - `ApiTokenExpiry.toExpiresAt({choice, customDate}, now = new Date())` returns:
    - for `30`/`90`, `new Date(now + n × 24h).toISOString()`;
    - for `custom`, the end of the chosen day (23:59:59.999) in the browser's local time,
      as an ISO string, e.g. `new Date(y, m-1, d, 23, 59, 59, 999).toISOString()`;
    - for `never`, `null`.
  - `minDate(now)` returns tomorrow as `YYYY-MM-DD` in local time.
  - Renders `<FieldErrors errors={errors.expires_at} />`.

Specs:

- Scope selection: Write ticks Read, Read can be unticked, the shortcuts, and only catalogue
  scopes rendered.
- Games picker: the empty note with the count, the superuser warning only when `all_games` is
  true and nothing is selected, the no-games note, and the 100 cap (the 101st game is not added
  and the hint shows).
- Expiry: the presets with a fixed `now`, the end-of-day custom conversion (check against a
  locally constructed Date so the spec passes in any TZ), `never` returning null, and `minDate`.

## Files to Change

- `frontend/assets/js/components/resources/account/pages/elements/ApiTokenScopePicker.jsx` (new)
- `frontend/assets/js/components/resources/account/pages/elements/ApiTokenScopeSelection.js` (new)
- `frontend/assets/js/components/resources/account/pages/elements/ApiTokenGamesPicker.jsx` (new)
- `frontend/assets/js/components/resources/account/pages/elements/ApiTokenExpiryField.jsx` and
  `ApiTokenExpiry.js` (new)
- `frontend/assets/js/components/common/forms/MultiResourcePickerField.jsx`: only if a small,
  backward-compatible change is needed for the cap (e.g. a `disabled` prop).
- the matching specs under `frontend/specs/assets/js/components/resources/account/pages/elements/`
  (new)
