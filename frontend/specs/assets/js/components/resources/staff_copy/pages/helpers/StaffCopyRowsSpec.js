import StaffCopyRows from '../../../../../../../../assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRows.js';
import StaffCopyFallbackRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyFallbackRow.jsx';
import StaffCopyItemRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyItemRow.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

/**
 * @description Stub row component used to exercise the registry.
 * @returns {null} nothing.
 */
function StubRow() {
  return null;
}

describe('StaffCopyRows', function() {
  afterEach(function() {
    StaffCopyRows.unregister('stub_type');
  });

  describe('.rowFor', function() {
    it('returns the items row for the items copy type', function() {
      expect(StaffCopyRows.rowFor('items')).toBe(StaffCopyItemRow);
    });

    it('falls back to the generic row for an unregistered slug', function() {
      expect(StaffCopyRows.rowFor('unregistered_type')).toBe(StaffCopyFallbackRow);
    });

    it('returns the registered component', function() {
      StaffCopyRows.register('stub_type', StubRow);

      expect(StaffCopyRows.rowFor('stub_type')).toBe(StubRow);
    });

    it('falls back again once unregistered', function() {
      StaffCopyRows.register('stub_type', StubRow);
      StaffCopyRows.unregister('stub_type');

      expect(StaffCopyRows.rowFor('stub_type')).toBe(StaffCopyFallbackRow);
    });
  });

  describe('.columnsFor', function() {
    it('returns the name column for an unregistered slug', function() {
      expect(StaffCopyRows.columnsFor('unregistered_type')).toEqual([Translator.t('staff_copies_page.name_column')]);
    });

    it('returns the photo, name and hidden column headers for items', function() {
      expect(StaffCopyRows.columnsFor('items')).toEqual([
        Translator.t('staff_copies_page.photo_column'),
        Translator.t('staff_copies_page.name_column'),
        Translator.t('staff_copies_page.hidden_column'),
      ]);
    });

    it('returns the translated registered column headers', function() {
      StaffCopyRows.register('stub_type', StubRow, ['staff_copies_page.name_column', 'staff_copies_page.status_column']);

      expect(StaffCopyRows.columnsFor('stub_type')).toEqual([
        Translator.t('staff_copies_page.name_column'),
        Translator.t('staff_copies_page.status_column'),
      ]);
    });

    it('defaults the registered columns to the name column', function() {
      StaffCopyRows.register('stub_type', StubRow);

      expect(StaffCopyRows.columnsFor('stub_type')).toEqual([Translator.t('staff_copies_page.name_column')]);
    });
  });
});
