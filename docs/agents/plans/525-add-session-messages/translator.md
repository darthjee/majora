# Translator Plan: Add session messages

Main plan: [plan.md](plan.md)

## Shared contracts

- Produces `game_session_page.messages_title`, `game_session_page.messages_content_label`,
  `game_session_page.messages_submit`, `game_session_page.messages_load_more` — consumed by
  the `frontend` agent's `SessionMessagesHelper.jsx` (`frontend.md` Step 4).

## Implementation Steps

### Step 1 — Add the new keys

Add to the existing `game_session_page:` namespace in both language files (alongside
`loading`/`edit`/`no_date`):

`frontend/assets/i18n/en.yaml`:
```yaml
game_session_page:
  loading: Loading session...
  edit: Edit
  no_date: No date
  messages_title: Messages
  messages_content_label: Message
  messages_submit: Send
  messages_load_more: Load more messages
```

`frontend/assets/i18n/pt.yaml`: add the equivalent Portuguese translations for the same four
keys, matching the existing `game_session_page:` block's tone/style in that file.

### Step 2 — Verify sync

Run the i18n sync-check script (`npm run check_i18n`, matching the `frontend-checks` CI
job) to confirm both files stay in sync after the addition.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add the four `game_session_page.messages_*` keys
- `frontend/assets/i18n/pt.yaml` — add the four `game_session_page.messages_*` keys

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- No English copy is prescribed by the issue — pick natural wording consistent with the
  other short labels already in `game_session_page.*`.
