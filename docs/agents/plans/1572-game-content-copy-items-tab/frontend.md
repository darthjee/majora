# Frontend Plan: Game content copy: Items tab

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes list rows `{id, name, hidden, photo, copied_to_target}` from
`GET staff/copies/items.json` (`photo` is a path string or `null`). Registers
`StaffCopyRows.register('items', StaffCopyItemRow, ['staff_copies_page.photo_column',
'staff_copies_page.name_column', 'staff_copies_page.hidden_column'])`. Relies on the translator
adding `staff_copies_page.photo_column`, `staff_copies_page.hidden_column` and
`staff_copies_page.hidden_badge` (en + pt).

## Implementation Steps

### Step 1 — Items row component
Add `StaffCopyItemRow` rendering only its own cells (the checkbox and the "already copied" status
cells are already rendered by `StaffCopySourceRow`):

1. cover thumbnail — reuse `StaffPhotoThumbnail` (`resources/staff_photo/pages/elements`) with
   `{ id: row.id, path: row.photo }`, which already shows a placeholder for an empty path and a
   broken image; otherwise follow its helper's placeholder markup;
2. name;
3. hidden badge when `row.hidden` (`badge text-bg-secondary` + `Icons.eyeSlashFill`, like
   `RecipeHiddenBadge`), with `Translator.t('staff_copies_page.hidden_badge')`; empty cell
   otherwise.

Keep JSX in a component/helper pair if it exceeds the project's component-size conventions.

### Step 2 — Register the row
Register it for `items` with the three column keys above, at module load, from a place the page
always imports (e.g. add the entry to the `ROWS` literal in `StaffCopyRows.js`, or a
`staff_copy/pages/rows/index.js` imported by `StaffCopies.jsx`) — the pattern #1573–#1577 will
copy. Update the `StaffCopyRows` doc comment that says the registry ships empty.

## Files to Change
- `frontend/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyItemRow.jsx` (new) — the row cells.
- `frontend/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRows.js` — `items` entry / doc update (or the new rows index file + its import in `StaffCopies.jsx`).
- `frontend/specs/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyItemRowSpec.js` (new) — thumbnail, placeholder when `photo` is null, name, hidden badge shown/absent.
- `frontend/specs/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRowsSpec.js` — `items` resolves to `StaffCopyItemRow` with the three headers; keep the fallback test on an unregistered slug.
- `StaffCopySourceListSpec.js` / `StaffCopiesSpec.js` — fix any test that assumed `items` falls back.

## CI Checks
- `frontend`: `make test-frontend` and `make lint-frontend` (Jasmine + ESLint) — CircleCI frontend jobs.

## Notes
- Existing specs may use `items` as the "unregistered" example slug; switch them to a slug that
  stays unregistered (e.g. a made-up one) so they keep testing the fallback after the later tabs land.
