/**
 * Builds a confirm handler that clears the pending value and runs the action with it.
 *
 * @param {*} pending - The pending value captured at render time.
 * @param {Function} setPending - Pending value setter.
 * @param {Function} run - Action run with the pending value.
 * @returns {Function} Confirm handler, returning the action result.
 */
export function confirmPending(pending, setPending, run) {
  return () => {
    setPending(null);
    return run(pending);
  };
}

/**
 * Builds the staff photos page handlers (issue #1474). Plain, non-hook function so it can be
 * exercised directly in specs.
 *
 * @param {object} params - Builder parameters.
 * @param {object} params.controller - The staff photos controller.
 * @param {{selectedPhotos: object[], onToggle: Function, onToggleAll: Function}} params.selection
 *   - Current selection and its toggles.
 * @param {object} params.pending - Pending modal values (`resize`, `bulk`, `delete`, `replace`).
 * @param {object} params.setters - Pending value setters (`setPendingResize`, `setPendingBulk`,
 *   `setPendingDelete`, `setPendingReplace`) plus `dismissBulkResult`.
 * @returns {{page: object, modals: object}} `page` handlers for `StaffPhotosHelper.render` and
 *   `modals` confirm / cancel handlers.
 */
export default function buildStaffPhotosHandlers({
  controller, selection, pending, setters,
}) {
  const {
    setPendingResize, setPendingBulk, setPendingDelete, setPendingReplace, dismissBulkResult,
  } = setters;

  return {
    page: {
      onResize: setPendingResize,
      onReplace: setPendingReplace,
      onDelete: setPendingDelete,
      onToggle: selection.onToggle,
      onToggleAll: selection.onToggleAll,
      onBulk: (action) => setPendingBulk({ action, photos: selection.selectedPhotos }),
      onCloseSummary: dismissBulkResult,
    },
    modals: {
      onConfirmResize: confirmPending(pending.resize, setPendingResize, (photo) => controller.handleResize(photo)),
      onConfirmBulk: confirmPending(
        pending.bulk, setPendingBulk, ({ action, photos }) => controller.runBulk(action, photos),
      ),
      onConfirmDelete: confirmPending(pending.delete, setPendingDelete, (photo) => controller.handleDelete(photo)),
      onReplaceSuccess: confirmPending(
        pending.replace, setPendingReplace, (photo) => controller.handleReplaceSuccess(photo),
      ),
      onReplaceError: (status) => controller.handleReplaceError(pending.replace, status),
    },
  };
}
