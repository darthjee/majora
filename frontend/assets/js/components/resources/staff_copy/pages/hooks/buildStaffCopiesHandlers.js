/**
 * Tells whether a re-copy confirmation is needed for the given rows.
 *
 * @param {{copied_to_target?: boolean}[]} rows - The selected rows.
 * @returns {boolean} `true` when any row was already copied into the target game.
 */
export function needsConfirmation(rows) {
  return rows.some((row) => Boolean(row.copied_to_target));
}

/**
 * Builds the staff copy page handlers (issue #1571). Plain, non-hook function so it can be
 * exercised directly in specs.
 *
 * @description `onCopy` runs the selected rows right away, unless some were already copied into
 *   the target game: then it stores them as pending so the re-copy confirmation shows. The
 *   modal's confirm runs the pending rows; cancel drops them (aborting the whole run).
 * @param {object} params - Builder parameters.
 * @param {object} params.controller - The staff copy controller.
 * @param {{selectedRows: object[], onToggle: Function, onToggleAll: Function}} params.selection
 *   - Current selection and its toggles.
 * @param {object[]|null} params.pendingCopy - Rows waiting for the re-copy confirmation.
 * @param {Function} params.setPendingCopy - Pending rows setter.
 * @returns {{page: object, modal: object}} `page` handlers for `StaffCopiesHelper.render` and
 *   `modal` confirm / cancel handlers.
 */
export default function buildStaffCopiesHandlers({
  controller, selection, pendingCopy, setPendingCopy,
}) {
  return {
    page: {
      onSelectGame: (key, slug) => controller.changeSelection(key, slug),
      onToggle: selection.onToggle,
      onToggleAll: selection.onToggleAll,
      onCopy: () => {
        const rows = selection.selectedRows;

        if (needsConfirmation(rows)) return setPendingCopy(rows);

        return controller.runCopy(rows);
      },
    },
    modal: {
      onConfirm: () => {
        setPendingCopy(null);
        return controller.runCopy(pendingCopy);
      },
      onCancel: () => setPendingCopy(null),
    },
  };
}
