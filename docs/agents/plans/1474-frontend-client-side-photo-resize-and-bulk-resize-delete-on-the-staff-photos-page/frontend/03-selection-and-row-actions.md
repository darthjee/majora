# Row Resize action, selection and bulk action bar

- `StaffPhotoRowActions.jsx`: add a **Resize** button (`staff_photos_page.resize`, using an existing icon from `Icons`) next to Replace / Delete. It is disabled under the same rule as Replace, plus `!photo.ready`, and calls `onResize(photo)`.
- Selection (current page only):
  - `selectedIds` state (a `Set` or array of ids) in `StaffPhotos.jsx`;
  - a new first table column, `select` (header label `select_column`), holding a checkbox per row (`aria-label` `select_photo`);
  - a "select all on this page" checkbox (`select_all_page`) above the table.
  - Selection is **cleared whenever the photo list changes** (page change, tab change, refetch after an action). The simplest approach is to reset it in the same place `setPhotos` lands, or key it off `photos`.
- New `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkActions.jsx`: shows `bulk_selected` with the count, plus **Resize selected** / **Delete selected** buttons, disabled when nothing is selected or a bulk job is running. Each button opens the bulk confirmation from step 04 with the selected photo rows.
- While `bulkJob` is set, disable the row actions and checkboxes.
- Render `actionInfo` (when set) as an info alert next to the existing action error alert in `StaffPhotosHelper`.
- `StaffPhotosHelper.render` / `#buildRow` receive the selection state and the new handlers (`onResize`, `onToggle`, `onToggleAll`).

Specs: row actions (Resize enabled / disabled), checkbox toggling, select all, selection reset on list change, bulk bar state, and the info alert.

## Files to Change

- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoRowActions.jsx` — Resize button.
- `frontend/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkActions.jsx` — new.
- `frontend/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotosHelper.jsx` — select column, select-all toggle, bulk bar, info alert, new handlers.
- `frontend/assets/js/components/resources/staff_photo/pages/StaffPhotos.jsx` — selection state and handlers.
- `frontend/specs/assets/js/components/resources/staff_photo/pages/helpers/StaffPhotosHelperSpec.js`, `frontend/specs/assets/js/components/resources/staff_photo/pages/StaffPhotosSpec.js` — extended.
- `frontend/specs/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoRowActionsSpec.js`, `frontend/specs/assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkActionsSpec.js` — new or extended.
