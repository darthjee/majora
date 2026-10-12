# Frontend Plan: Game content copy: Documents tab

Main plan: [plan.md](plan.md)

## Shared contracts

Consume the `documents` list row from [plan.md](plan.md#shared-contracts)
(`id`, `name`, `hidden`, `photo` (string|null), `pages_count`, `photos_count`, `files_count`,
`copied_to_target`) and the translator's `staff_copies_page.counts_column` /
`staff_copies_page.document_counts` (`{{pages}}`, `{{photos}}`, `{{files}}`) keys.

## Implementation Steps

### Step 1 — `StaffCopyDocumentRow`
Create `frontend/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyDocumentRow.jsx`,
modelled on `StaffCopyItemRow`. It renders only its own cells (the shared source row renders the
checkbox and the status cell, including the "already copied" flag, as for the other tabs):
1. cover thumbnail: `StaffPhotoThumbnail` with `{ id: row.id, path: row.photo }` (placeholder when null);
2. name;
3. counts: `Translator.t('staff_copies_page.document_counts', { pages, photos, files })`;
4. hidden badge: `StaffCopyHiddenBadge`.

Add the JSDoc header in the same style (issue #1577). Spec:
`frontend/specs/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyDocumentRowSpec.js`
covers the thumbnail with a path, the placeholder when `photo` is null, the name, the counts text,
and the hidden badge shown/absent.

### Step 2 — Register the row
In `frontend/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRows.js`, add a
`documents` entry (after `recipes`) with the component and columns `photo_column`, `name_column`,
`counts_column`, `hidden_column`. Extend `StaffCopyRowsSpec.js` with `rowFor('documents')` and
`columnsFor('documents')`.

## Files to Change
- `frontend/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyDocumentRow.jsx` — new row component.
- `frontend/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRows.js` — register `documents`.
- `frontend/specs/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyDocumentRowSpec.js` — new spec.
- `frontend/specs/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRowsSpec.js` — registry spec.

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
- `frontend`: `docker-compose run --rm majora_fe npm run coverage` (CI job: `jasmine`)

## Notes
- The "already copied" flag (`copied_to_target`) is already rendered by the shared
  `StaffCopyRowStatus` cell, so this row does not render it.
