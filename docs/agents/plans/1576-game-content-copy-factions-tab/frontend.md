# Frontend Plan: Game content copy: Factions tab

Main plan: [plan.md](plan.md)

## Shared contracts

Rows from `GET /staff/copies/factions.json` carry `id`, `name`, `photo` (nullable),
`copied_to_target`, `name_taken_in_target`. Copy `422` is already mapped to
`staff_copies_page.entity_error.name_taken` by `helpers/StaffCopyErrors.js`.

## Implementation Steps

### Step 1 — Factions row component and registration
Create `StaffCopyFactionRow.jsx` modelled on `StaffCopyPossessionRow.jsx`, without the hidden
badge/column (factions have no `hidden`): cells are the cover thumbnail
(`StaffPhotoThumbnail` with `{ id: row.id, path: row.photo }`, placeholder when null) and the
name. The checkbox and `StaffCopyRowStatus` (already copied flag + "name already used" badge) are
rendered by the shared `StaffCopySourceRow`. Register it in `StaffCopyRows.js` `ROWS` as
`factions: { component: StaffCopyFactionRow, columns: ['staff_copies_page.photo_column', NAME_COLUMN_KEY] }`.

### Step 2 — Specs
Add `StaffCopyFactionRowSpec.js` (thumbnail, placeholder when `photo` null, name, `<td>` count)
and a `factions` case in `StaffCopyRowsSpec.js`. If cheap, add a `StaffCopySourceRow`-level spec
asserting that a faction row with `name_taken_in_target: true` shows the "name already used"
badge and the checkbox stays enabled.

## Files to Change
- `frontend/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyFactionRow.jsx` — new row component
- `frontend/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRows.js` — register `factions`
- `frontend/specs/assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyFactionRowSpec.js` — new spec
- `frontend/specs/assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRowsSpec.js` — factions case

## CI Checks
- `frontend`: `docker-compose run --rm majora_fe yarn test` and `docker-compose run --rm majora_fe yarn lint`

## Notes
- No new i18n keys: `tabs.factions`, `photo_column`, `entity_error.name_taken`, `copied_to_target` already exist in en and pt.
