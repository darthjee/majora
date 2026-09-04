# Translator Plan: Frontend — link staff user list rows to /#/staff/users/:id and prep it as token-panel host

Main plan: [plan.md](plan.md)

## Shared contracts

Produce one new key in the `staff_user_page:` namespace, identical across every locale, for the
`frontend` agent to consume via `Translator.t('staff_user_page.status_label')`:

| Key | `en` | `pt` |
| --- | --- | --- |
| `staff_user_page.status_label` | `Status` | `Status` |

No other keys change. The status **text** (`Pending` / `Approved` / `Denied`) is already covered
by the existing `staff_users_page.status_*` keys, which the detail page reuses through
`StaffUserStatusBadges` — nothing to add there.

## Implementation Steps

### Step 1 — Add `staff_user_page.status_label` to every locale

- `frontend/assets/i18n/en/staff_user_page.yaml` — add `status_label: Status` under
  `staff_user_page:`, next to `name_label` / `email_label`.
- `frontend/assets/i18n/pt/staff_user_page.yaml` — add `status_label: Status` in the same place.

The `staff_user_page.yaml` file already exists in both locale directories and is already listed in
each `index.js` manifest, so no new file or manifest entry is needed. Keep the key set identical
across `en` and `pt`, then run the check.

## Files to Change

- `frontend/assets/i18n/en/staff_user_page.yaml` — add `status_label: Status`
- `frontend/assets/i18n/pt/staff_user_page.yaml` — add `status_label: Status`

## CI Checks

- `frontend/assets/i18n/`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- `pt` uses `Status` verbatim, matching the existing `status_column: Status` in
  `pt/staff_users_page.yaml`.
