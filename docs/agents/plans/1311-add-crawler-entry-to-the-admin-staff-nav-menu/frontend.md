# Frontend Plan: Add "Crawler" entry to the admin/staff nav menu

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Register the nav entry

In `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx`, add a new `adminItem(...)` call to `NAV_LINK_REGISTRY`, right after the existing `staff-dashboard` entry:

```js
adminItem('staff-crawler', 'staff/crawler', 'header.nav_staff_crawler'),
```

This reuses `adminItem`'s existing `IS_ADMIN` (superuser-or-staff) gating and `#/${path}` href construction — no other code changes needed in this file.

### Step 2 — Add translations

Add the `nav_staff_crawler` key to the `header:` namespace in both locale files, next to `nav_staff_dashboard`:

- `frontend/assets/i18n/en/common.yaml`: `nav_staff_crawler: Crawler`
- `frontend/assets/i18n/pt/common.yaml`: `nav_staff_crawler: Crawler` (kept as-is in Portuguese, same as the existing `nav_staff_dashboard: Dashboard` borrowed term)

## Files to Change

- `frontend/assets/js/components/common/header/helpers/HeaderNavHelper.jsx` — add the `staff-crawler` `adminItem(...)` entry to `NAV_LINK_REGISTRY`.
- `frontend/assets/i18n/en/common.yaml` — add `header.nav_staff_crawler: Crawler`.
- `frontend/assets/i18n/pt/common.yaml` — add `header.nav_staff_crawler: Crawler`.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe yarn coverage` (CI job: `jasmine`)

## Notes

- No new/updated spec file is needed: `frontend/specs/assets/js/components/common/header/helpers/HeaderHelper/registrySpec.js` already asserts `NAV_LINK_REGISTRY` has unique ids and that every entry's `rules` only reference real `CurrentPageContext` fields, generically covering the new entry; `renderGroupSpec.jsx` already covers `HeaderNavHelper.renderGroup`'s gating/rendering logic with synthetic entries. Running the existing suite (`yarn coverage`) is enough to confirm nothing broke — this is narrower than the issue's "update/add a Jasmine spec" wording, which assumed per-entry specs existed.
