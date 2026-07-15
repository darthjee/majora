# Translator Plan: Add User Avatar

Main plan: [plan.md](plan.md)

## Shared contracts

- Produces `my_account_page.avatar_alt`, consumed by the `frontend` agent's `Avatar` usage
  in `MyAccountHelper.jsx` — see `frontend.md` Step 4.

## Implementation Steps

### Step 1 — Add the new key

Add `avatar_alt` to the existing `my_account_page:` namespace in both language files,
alongside `title`/`loading`/`name_label`/etc.:

`frontend/assets/i18n/en.yaml`:
```yaml
my_account_page:
  title: My Account
  loading: Loading account...
  avatar_alt: User avatar
  name_label: Name
  ...
```

`frontend/assets/i18n/pt.yaml`: add the equivalent Portuguese translation for the same key,
matching the existing `my_account_page:` block's tone/style in that file.

### Step 2 — Verify sync

Run the i18n sync-check script (`npm run check_i18n`, matching the `frontend-checks` CI
job) to confirm both files stay in sync after the addition.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `my_account_page.avatar_alt`
- `frontend/assets/i18n/pt.yaml` — add `my_account_page.avatar_alt`

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- No English copy is prescribed by the issue — pick natural wording (e.g. "User avatar")
  consistent with the other short labels already in `my_account_page.*`.
