import { useState } from 'react';

/**
 * Returns the selected ids still valid for the current photo list.
 *
 * @description The selection is bound to the photo list it was made on: once the list changes
 *   (page change, tab change, refetch after an action) the selection is considered empty.
 * @param {{photos: object[], ids: number[]}} selection - Stored selection.
 * @param {object[]} photos - Current photo rows.
 * @returns {number[]} Selected photo ids.
 */
export function currentSelection(selection, photos) {
  return selection.photos === photos ? selection.ids : [];
}

/**
 * Toggles an id in a selection.
 *
 * @param {number[]} ids - Selected ids.
 * @param {number} id - Id to toggle.
 * @returns {number[]} The new selected ids.
 */
export function toggleId(ids, id) {
  return ids.includes(id) ? ids.filter((selected) => selected !== id) : [...ids, id];
}

/**
 * Tells whether every photo of the page is selected.
 *
 * @param {number[]} ids - Selected ids.
 * @param {object[]} photos - Current photo rows.
 * @returns {boolean} `true` when the page has photos and all of them are selected.
 */
export function allSelected(ids, photos) {
  return photos.length > 0 && photos.every((photo) => ids.includes(photo.id));
}

/**
 * Toggles the selection of every photo of the page.
 *
 * @param {number[]} ids - Selected ids.
 * @param {object[]} photos - Current photo rows.
 * @returns {number[]} No ids when all were selected, otherwise every photo id.
 */
export function toggleAllIds(ids, photos) {
  return allSelected(ids, photos) ? [] : photos.map((photo) => photo.id);
}

/**
 * Per-page photo selection of the staff photos page (issue #1474).
 *
 * @param {object[]} photos - Current photo rows.
 * @returns {{selectedIds: number[], selectedPhotos: object[], onToggle: Function,
 *   onToggleAll: Function}} Selected ids and rows, plus the row / select-all toggles.
 */
export default function useStaffPhotoSelection(photos) {
  const [selection, setSelection] = useState({ photos, ids: [] });
  const selectedIds = currentSelection(selection, photos);

  return {
    selectedIds,
    selectedPhotos: photos.filter((photo) => selectedIds.includes(photo.id)),
    onToggle: (photo) => setSelection({ photos, ids: toggleId(selectedIds, photo.id) }),
    onToggleAll: () => setSelection({ photos, ids: toggleAllIds(selectedIds, photos) }),
  };
}
