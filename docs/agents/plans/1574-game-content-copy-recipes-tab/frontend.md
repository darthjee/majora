# Frontend Plan: Game content copy: Recipes tab

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the `GET /staff/copies/recipes.json` row shape and the `staff_copies_page`
i18n keys `common_item_column`, `common_item_reused`, `common_item_will_copy` from
[plan.md](plan.md#shared-contracts).

## Implementation Steps

### Step 1 — Row component
Add `StaffCopyRecipeRow.jsx` under `staff_copy/pages/elements/rows/`, following
`StaffCopyCommonItemRow.jsx`: renders only its own cells — name; common item name with the
"reused" (`common_item.copied_to_target`) or "will be copied" indicator; hidden badge
(`StaffCopyHiddenBadge`). The checkbox and the "already copied" status cell are rendered by the
shared `StaffCopySourceRow`. The indicator reflects the list as loaded (no live update).

### Step 2 — Registration and specs
Register `recipes` in the `ROWS` literal of `StaffCopyRows.js` with columns
`[name_column, common_item_column, hidden_column]`. Add `StaffCopyRecipeRowSpec.js` (name,
common item name, reused / will-be-copied indicator, hidden badge) and extend
`StaffCopyRowsSpec.js` for the `recipes` entry.

## Files to Change
- `frontend/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyRecipeRow.jsx` — new.
- `frontend/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRows.js` — register `recipes`.
- `frontend/specs/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyRecipeRowSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRowsSpec.js` — `recipes` registration.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn test` and `docker-compose run --rm majora_fe yarn lint`
