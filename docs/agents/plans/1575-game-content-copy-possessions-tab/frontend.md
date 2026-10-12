# Frontend Plan: Game content copy: Possessions tab

Main plan: [plan.md](plan.md)

## Shared contracts

Rely on `GET /staff/copies/possessions.json` rows `{id, name, hidden, photo (string|null), copied_to_target}`. The slug is `possessions`. The shared source list already renders the checkbox and the status cell (with the "already copied" flag from `copied_to_target`).

## Implementation Steps

### Step 1 — Possessions row component and registration
Add `StaffCopyPossessionRow.jsx` under `staff_copy/pages/elements/rows/`, modelled on `StaffCopyItemRow`. It renders only its own cells:
- the cover thumbnail through `StaffPhotoThumbnail`, which shows the placeholder when `photo` is null;
- the name;
- `StaffCopyHiddenBadge`.

Register it under `possessions` in the `ROWS` literal of `StaffCopyRows.js`, with the columns `['staff_copies_page.photo_column', NAME_COLUMN_KEY, 'staff_copies_page.hidden_column']`. All of these i18n keys already exist, as does the tab label `staff_copies_page.types.possessions`, so no translation work is needed.

### Step 2 — Specs
Add `StaffCopyPossessionRowSpec.js` covering:
- the thumbnail with a ready cover;
- the placeholder when `photo` is null;
- the name;
- the hidden badge shown or hidden;
- the "already copied" flag through the source row, if the item row spec covers it.

Extend `StaffCopyRowsSpec.js` so that `possessions` resolves to the new row with its three column headers.

## Files to Change
- `frontend/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyPossessionRow.jsx` — new row component.
- `frontend/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRows.js` — register `possessions`.
- `frontend/specs/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyPossessionRowSpec.js` — new spec.
- `frontend/specs/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRowsSpec.js` — registry case.

## CI Checks
- `frontend`: Jasmine specs and ESLint, plus `yarn check_i18n`, run through `docker-compose run --rm majora_fe ...`.

## Notes
- The cells are identical to `StaffCopyItemRow`. Keep a separate component anyway, to follow the one-row-per-tab convention and leave room for the spec to diverge later.
