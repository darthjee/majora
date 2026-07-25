# Translator Plan: Add authorize login

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on [frontend.md](frontend.md)'s component/section naming — coordinate key names
with whatever section names the frontend agent actually uses for the login modal's new
mode and the new account page, so `Translator.t(...)` calls resolve. If frontend work
lands first, read its component files for the exact `Translator.t('section.key')` calls
already in place and match those keys; if this lands first, use the section names below
as the default and flag any rename needed.

## Implementation Steps

### Step 1 — Add new keys to `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`

Extend the existing `login_modal:` section with the new mode's strings (mode radio
labels, login-only form label, "waiting for approval" status text, retry/error text,
expired/denied/approved outcome text).

Add a new top-level section (name to match whatever the frontend page component ends up
called, default `authorization_requests_page:`) with: page title, table column headers
(uuid, request date, status), status labels for all five states (`open`, `approved`,
`denied`, `expired`, `logged`), dismiss/authorize button labels, and the two confirm
modals' title/body copy (including labels for the displayed IP/browser fields) and
password field label.

Add the new "My account" menu item label (e.g. under the existing `header:` section,
alongside `my_account_alt`/`nav_my_games`).

### Step 2 — Verify sync

Run the sync-check script (`npm run check_i18n` from `frontend/`) and fix any reported
mismatch between `en.yaml` and `pt.yaml` before considering this done.

## Files to Change

- `frontend/assets/i18n/en.yaml` — new keys.
- `frontend/assets/i18n/pt.yaml` — new keys (Portuguese translations).

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`).

## Notes

- No new files — this is purely additions to the two existing YAML files.
- Coordinate key names with [frontend.md](frontend.md) rather than guessing; a mismatch
  here just means updating the key name in one place, not a functional bug, but doing it
  right the first time avoids review churn.
