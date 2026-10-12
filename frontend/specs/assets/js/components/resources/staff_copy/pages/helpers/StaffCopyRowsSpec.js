import StaffCopyRows from '../../../../../../../../assets/js/components/resources/staff_copy/pages/helpers/StaffCopyRows.js';
import StaffCopyFallbackRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyFallbackRow.jsx';
import StaffCopyCommonItemRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyCommonItemRow.jsx';
import StaffCopyDocumentRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyDocumentRow.jsx';
import StaffCopyFactionRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyFactionRow.jsx';
import StaffCopyItemRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyItemRow.jsx';
import StaffCopyPossessionRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyPossessionRow.jsx';
import StaffCopyRecipeRow from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyRecipeRow.jsx';
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

    it('returns the common items row for the common_items copy type', function() {
      expect(StaffCopyRows.rowFor('common_items')).toBe(StaffCopyCommonItemRow);
    });

    it('returns the recipes row for the recipes copy type', function() {
      expect(StaffCopyRows.rowFor('recipes')).toBe(StaffCopyRecipeRow);
    });

    it('returns the documents row for the documents copy type', function() {
      expect(StaffCopyRows.rowFor('documents')).toBe(StaffCopyDocumentRow);
    });

    it('returns the possessions row for the possessions copy type', function() {
      expect(StaffCopyRows.rowFor('possessions')).toBe(StaffCopyPossessionRow);
    });

    it('returns the factions row for the factions copy type', function() {
      expect(StaffCopyRows.rowFor('factions')).toBe(StaffCopyFactionRow);
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

    it('returns the photo, name, category, price and hidden column headers for common_items', function() {
      expect(StaffCopyRows.columnsFor('common_items')).toEqual([
        Translator.t('staff_copies_page.photo_column'),
        Translator.t('staff_copies_page.name_column'),
        Translator.t('staff_copies_page.category_column'),
        Translator.t('staff_copies_page.price_column'),
        Translator.t('staff_copies_page.hidden_column'),
      ]);
    });

    it('returns the name, common item and hidden column headers for recipes', function() {
      expect(StaffCopyRows.columnsFor('recipes')).toEqual([
        Translator.t('staff_copies_page.name_column'),
        Translator.t('staff_copies_page.common_item_column'),
        Translator.t('staff_copies_page.hidden_column'),
      ]);
    });

    it('returns the photo, name, counts and hidden column headers for documents', function() {
      expect(StaffCopyRows.columnsFor('documents')).toEqual([
        Translator.t('staff_copies_page.photo_column'),
        Translator.t('staff_copies_page.name_column'),
        Translator.t('staff_copies_page.counts_column'),
        Translator.t('staff_copies_page.hidden_column'),
      ]);
    });

    it('returns the photo, name and hidden column headers for possessions', function() {
      expect(StaffCopyRows.columnsFor('possessions')).toEqual([
        Translator.t('staff_copies_page.photo_column'),
        Translator.t('staff_copies_page.name_column'),
        Translator.t('staff_copies_page.hidden_column'),
      ]);
    });

    it('returns the photo and name column headers for factions', function() {
      expect(StaffCopyRows.columnsFor('factions')).toEqual([
        Translator.t('staff_copies_page.photo_column'),
        Translator.t('staff_copies_page.name_column'),
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
