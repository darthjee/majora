# Translator Plan: Add poll closing button

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" — new keys go under the existing
`game_poll_page` namespace (`frontend/assets/i18n/en.yaml` /
`frontend/assets/i18n/pt.yaml`), matching the style already there (e.g.
`options_title: Options`, `cast_vote: Cast Vote`). `Translator.t()` has no
interpolation, so any string that needs to include the poll's title (e.g. the
confirmation message) must be a standalone phrase composed with `{poll.title}`
in JSX by [frontend.md](frontend.md), not a `%{title}`-style placeholder in
the YAML.

## Implementation Steps

### Step 1 — Add new keys to `en.yaml`

Under the existing `game_poll_page:` block (`frontend/assets/i18n/en.yaml`),
add:

```yaml
  close_button: Close Poll
  close_modal_title: Close Poll
  close_confirm_message: Are you sure you want to close this poll?
  override_decision_label: Override Decision
  close_tie_alert: There was a tie. Only the first tied option will be selected; the others will be ignored.
  winner_badge: Winner
  close_submit: Close Poll
  close_cancel: Cancel
  close_error: Failed to close poll. Please try again.
```

Adjust exact key names/count only if `frontend.md`'s implementation ends up
needing more/fewer strings (e.g. separate labels for the two modal states) —
coordinate with the frontend agent's actual `Translator.t()` calls rather
than guessing further ahead of the UI code.

### Step 2 — Mirror into `pt.yaml`

Add the same keys, translated, to `frontend/assets/i18n/pt.yaml`'s
`game_poll_page:` block, keeping key order identical to `en.yaml` (existing
convention in this file).

### Step 3 — Verify sync

Run the translation-sync check locally to confirm both files stay in lockstep
(see CI Checks below) before considering this done.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `game_poll_page.*` close-flow keys.
- `frontend/assets/i18n/pt.yaml` — mirror the same keys, translated.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — fails if the
  two files' keys diverge.

## Notes

- Land this after (or alongside) `frontend.md` so the exact set of keys the
  UI actually calls `Translator.t()` with is known — don't let the key list
  above be treated as final if the frontend implementation needs to adjust
  it.
