# Translator Plan: Block new users

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section, "i18n" subsection. The frontend agent decides the exact key names for the pending-approval screen; the `staff_users_page` additions below are predictable extensions of the existing namespace (`frontend/assets/i18n/en.yaml:264-273`).

## Implementation Steps

### Step 1 — Extend `staff_users_page`

Add these keys to every locale file under `frontend/assets/i18n/` (currently `en.yaml`, `pt.yaml`), alongside the existing `staff_users_page` entries:

- `status_column` — table header for the new status column (e.g. "Status").
- `display_name_column` — table header for the new display-name column (e.g. "Display Name").
- `status_pending`, `status_approved`, `status_denied` — status badge labels (mirror `authorization_requests_page`'s `status_open`/`status_approved`/`status_denied`/... naming convention already in the same file).
- `approve`, `deny` — row action button labels.
- Filter bar labels (final key names depend on how the frontend agent names `StaffUsersFilters`, e.g. `filter_status_label`, `filter_status_all`, `filter_search_placeholder`) — coordinate with the frontend agent's actual key names before finalizing, rather than guessing here.

### Step 2 — Add the pending-approval screen namespace

Once the frontend agent has built the "awaiting approval" screen (`frontend.md` Step 5) and picked its namespace/keys, add them to every locale file. Likely needs at least a title and a body message key.

### Step 3 — Verify

Run:
```bash
docker-compose run --rm majora_fe yarn check_i18n
```
Fix any reported key mismatch across locales before considering the task done.

## Files to Change

- `frontend/assets/i18n/en.yaml` — new `staff_users_page` keys + pending-approval namespace.
- `frontend/assets/i18n/pt.yaml` — same keys, translated.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (part of CI job `checks`/`frontend-checks`)

## Notes

- This agent's work depends on the frontend agent finalizing key names first for the filter bar and the pending-approval screen (Steps 1's last bullet and Step 2) — coordinate rather than guessing ahead of them.
