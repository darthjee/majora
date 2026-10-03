import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useStaffPhotoSelection, {
  allSelected, currentSelection, toggleAllIds, toggleId,
} from '../../../../../../../../assets/js/components/resources/staff_photo/pages/hooks/useStaffPhotoSelection.js';

describe('useStaffPhotoSelection', function() {
  const photos = [{ id: 1 }, { id: 2 }];

  describe('currentSelection', function() {
    it('keeps the ids while the list is the same', function() {
      expect(currentSelection({ photos, ids: [2] }, photos)).toEqual([2]);
    });

    it('resets the selection when the list changes', function() {
      expect(currentSelection({ photos, ids: [2] }, [...photos])).toEqual([]);
    });
  });

  describe('toggleId', function() {
    it('adds a missing id', function() {
      expect(toggleId([1], 2)).toEqual([1, 2]);
    });

    it('removes a selected id', function() {
      expect(toggleId([1, 2], 1)).toEqual([2]);
    });
  });

  describe('allSelected', function() {
    it('is true when every photo is selected', function() {
      expect(allSelected([2, 1], photos)).toBe(true);
    });

    it('is false when some photo is not selected', function() {
      expect(allSelected([1], photos)).toBe(false);
    });

    it('is false for an empty page', function() {
      expect(allSelected([], [])).toBe(false);
    });
  });

  describe('toggleAllIds', function() {
    it('selects every photo when not all are selected', function() {
      expect(toggleAllIds([1], photos)).toEqual([1, 2]);
    });

    it('clears the selection when all are selected', function() {
      expect(toggleAllIds([1, 2], photos)).toEqual([]);
    });
  });

  describe('hook', function() {
    it('starts with an empty selection', function() {
      let result;

      /**
       * @description Captures the hook result.
       * @returns {null} nothing.
       */
      function Probe() {
        result = useStaffPhotoSelection(photos);
        return null;
      }

      renderToStaticMarkup(React.createElement(Probe));

      expect(result.selectedIds).toEqual([]);
      expect(result.selectedPhotos).toEqual([]);
      expect(result.onToggle).toEqual(jasmine.any(Function));
      expect(result.onToggleAll).toEqual(jasmine.any(Function));
    });
  });
});
