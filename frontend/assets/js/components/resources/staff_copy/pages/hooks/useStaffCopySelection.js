import { useState } from 'react';
import {
  allSelected, currentSelection, toggleAllIds, toggleId,
} from '../../../staff_photo/pages/hooks/useStaffPhotoSelection.js';

export { allSelected };

/**
 * Per-page row selection of the staff copy source list (issue #1571).
 *
 * @description Reuses the staff photos page selection rules: the selection is bound to the row
 *   list it was made on, so a page change, tab change or refetch clears it.
 * @param {object[]} rows - Current source rows.
 * @returns {{selectedIds: number[], selectedRows: object[], onToggle: Function,
 *   onToggleAll: Function, clear: Function}} Selected ids and rows, the row / select-all
 *   toggles and a clearer.
 */
export default function useStaffCopySelection(rows) {
  const [selection, setSelection] = useState({ photos: rows, ids: [] });
  const selectedIds = currentSelection(selection, rows);

  return {
    selectedIds,
    selectedRows: rows.filter((row) => selectedIds.includes(row.id)),
    onToggle: (row) => setSelection({ photos: rows, ids: toggleId(selectedIds, row.id) }),
    onToggleAll: () => setSelection({ photos: rows, ids: toggleAllIds(selectedIds, rows) }),
    clear: () => setSelection({ photos: rows, ids: [] }),
  };
}
