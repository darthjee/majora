import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useStaffCopySelection, {
  allSelected,
} from '../../../../../../../../assets/js/components/resources/staff_copy/pages/hooks/useStaffCopySelection.js';

describe('useStaffCopySelection', function() {
  const rows = [{ id: 1 }, { id: 2 }];

  it('re-exports allSelected', function() {
    expect(allSelected([1, 2], rows)).toBe(true);
    expect(allSelected([1], rows)).toBe(false);
  });

  it('starts with an empty selection', function() {
    let result;

    /**
     * @description Captures the hook result.
     * @returns {null} nothing.
     */
    function Probe() {
      result = useStaffCopySelection(rows);
      return null;
    }

    renderToStaticMarkup(React.createElement(Probe));

    expect(result.selectedIds).toEqual([]);
    expect(result.selectedRows).toEqual([]);
    expect(result.onToggle).toEqual(jasmine.any(Function));
    expect(result.onToggleAll).toEqual(jasmine.any(Function));
    expect(result.clear).toEqual(jasmine.any(Function));
  });
});
