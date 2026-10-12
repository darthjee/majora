# Frontend Plan: Game content copy: Common items tab

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes rows `{id, name, category, price, hidden, photo, copied_to_target}` from
`GET /staff/copies/common_items.json`. Relies on the translator adding
`staff_copies_page.category_column` and `staff_copies_page.price_column`. Category labels come
from `common_item_page.category.<value>`.

## Implementation Steps

### Step 1 — Common items row component and registration
Add `StaffCopyCommonItemRow`, mirroring `StaffCopyItemRow`. It renders only its own cells:
cover thumbnail (`StaffPhotoThumbnail`, placeholder when `photo` is null), name, translated
category (`Translator.t(\`common_item_page.category.${row.category}\`)`), price, and
`StaffCopyHiddenBadge`. The checkbox and the "already copied" flag are already rendered by the
shared selection and status cells of `StaffCopySourceRow`. Register it in the `ROWS` literal of
`StaffCopyRows` under `common_items`, with columns `photo_column`, `name_column`,
`category_column`, `price_column` and `hidden_column`.

### Step 2 — Specs
Add `StaffCopyCommonItemRowSpec` covering thumbnail, placeholder, translated category, price
and hidden badge. Extend `StaffCopyRowsSpec` for the `common_items` registration and headers. If
any spec uses `common_items` as an "unregistered" fallback slug, move it to another
unregistered slug, as #1572 did for items.

## Files to Change
- `frontend/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyCommonItemRow.jsx` — new row.
- `frontend/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRows.js` — register `common_items`.
- `frontend/spec/.../staff_copy/pages/elements/rows/StaffCopyCommonItemRowSpec.js` — new spec (mirror the `StaffCopyItemRowSpec` location).
- `frontend/spec/.../staff_copy/pages/helpers/StaffCopyRowsSpec.js` — registration/headers.

## CI Checks
- `frontend/`: `npm run coverage` and `npm run lint`, through docker-compose/make (CI jobs:
  `jasmine`, `frontend-checks`)

## Notes
- No new i18n keys beyond the two column headers; category labels already exist.
