# Map the tracking fields

Extend `toRow` in `VisitListController` with the five fields, camelCased: `firstPath`,
`lastPath`, `sessionFirstPath`, `sessionCreationReason`, `sessionFirstSeenLogged`. Pass the
values through unchanged — `null` stays `null`, and the logged flag keeps `true` / `false` /
`null` (no `Boolean()`). Update the `toRow` JSDoc row shape.

Specs: the mapping of all five fields with values, with `null`, and with
`session_first_seen_logged: false` (stays `false`, distinct from `null`).

## Files to Change

- `frontend/assets/js/components/resources/staff_statistics/pages/controllers/VisitListController.js` — map the five fields.
- `frontend/specs/assets/js/components/resources/staff_statistics/pages/controllers/VisitListControllerSpec.js` — mapping specs.
