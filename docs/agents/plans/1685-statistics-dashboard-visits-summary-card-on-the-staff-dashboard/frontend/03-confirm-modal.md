# Typed-confirmation modal

Add `elements/ClearStatisticsConfirmModal.jsx` and
`elements/helpers/ClearStatisticsConfirmModalHelper.jsx`, modelled on `ClearCacheConfirmModal`
and its helper (react-bootstrap `Modal`). Add a text input to them.

**Component:**

- `ClearStatisticsConfirmModal({ show, onConfirm, onCancel })` holds the input value in
  `useState`.
- `CONFIRMATION_WORD = 'CLEAR'` is a module constant and is never translated.
- `canConfirm` is `value.trim() === CONFIRMATION_WORD`. The comparison is case-sensitive.
- Cancel and the header close button (`onHide`) reset the input to `''` before calling
  `onCancel`.
- Confirm also resets the input before calling `onConfirm`, so reopening the modal starts empty.

**Helper:** `render(show, { value, canConfirm }, { onChange, onConfirm, onCancel })` renders:

- the title, `body` and `instruction` from `clear_statistics_confirm_modal`;
- a labelled `<input type="text" className="form-control">` (`input_label`), with
  `autoComplete="off"`;
- Cancel (`btn-secondary`) and Confirm (`btn-danger`, `disabled={!canConfirm}`).

## Files to Change

- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/ClearStatisticsConfirmModal.jsx`
  — new.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearStatisticsConfirmModalHelper.jsx`
  — new.
