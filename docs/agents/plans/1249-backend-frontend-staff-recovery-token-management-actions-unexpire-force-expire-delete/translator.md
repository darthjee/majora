# Translator Plan: Backend/Frontend — staff recovery token management actions (unexpire / force-expire / delete)

Main plan: [plan.md](plan.md)

## Shared contracts

Produces every i18n key `frontend` references in steps 03/04 of [frontend.md](frontend.md). Key
names below are fixed — `frontend` builds its lookups against these exact strings.

## Implementation Steps

### Step 1 — Add the new keys (`en` and `pt`)

Add to `frontend/assets/i18n/en/staff_user_page.yaml` (alongside pt, mirroring the same key set)
under the existing `staff_user_page:` namespace:

- `recovery_token_actions_column` — actions table-column header (e.g. "Actions").
- `recovery_token_action_unexpire` — row button label (e.g. "Unexpire").
- `recovery_token_action_force_expire` — row button label (e.g. "Force expire").
- `recovery_token_action_delete` — row button label (e.g. "Delete").
- `recovery_token_generate_button` — panel-level button label (e.g. "Generate recovery link").
- `recovery_token_action_error` — transient alert shown on a stale/concurrent action 404 (e.g.
  "That action could not be completed — the list has been refreshed.").

Add to `frontend/assets/i18n/en/common.yaml` (alongside pt), a new top-level namespace mirroring
`clear_cache_confirm_modal`/`delete_photo_confirm_modal`'s existing shape:

```yaml
recovery_token_action_confirm_modal:
  cancel: Cancel
  delete_title: Delete recovery token
  delete_body: Are you sure you want to delete this recovery token? This cannot be undone.
  delete_confirm: Delete
  force_expire_title: Force-expire recovery token
  force_expire_body: Are you sure you want to force-expire this recovery token? It will no longer be usable to reset this user's password.
  force_expire_confirm: Force expire
```

Run the translation-sync check script (`npm run check_i18n`) locally to confirm `en`/`pt` stay in
sync before handing off to `frontend`.

## Files to Change

- `frontend/assets/i18n/en/staff_user_page.yaml`
- `frontend/assets/i18n/pt/staff_user_page.yaml`
- `frontend/assets/i18n/en/common.yaml`
- `frontend/assets/i18n/pt/common.yaml`

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)
