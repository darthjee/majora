import StaffPhotoTypes from '../../../../../../../../assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoTypes.js';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoTypes', function() {
  describe('.resolveType', function() {
    const types = ['game', 'character', 'treasure'];

    it('returns the requested type when it is available', function() {
      expect(StaffPhotoTypes.resolveType(types, 'character')).toBe('character');
    });

    it('falls back to the first type when the requested type is unknown', function() {
      expect(StaffPhotoTypes.resolveType(types, 'mystery')).toBe('game');
    });

    it('falls back to the first type when no type is requested', function() {
      expect(StaffPhotoTypes.resolveType(types, undefined)).toBe('game');
      expect(StaffPhotoTypes.resolveType(types, null)).toBe('game');
    });

    it('returns null when there are no types', function() {
      expect(StaffPhotoTypes.resolveType([], 'game')).toBeNull();
    });
  });

  describe('.label', function() {
    it('returns the translated type label', function() {
      expect(StaffPhotoTypes.label('game_faction')).toBe(Translator.t('staff_photos_page.types.game_faction'));
      expect(StaffPhotoTypes.label('game_faction')).not.toBe('game_faction');
    });

    it('falls back to the raw slug when the translation is missing', function() {
      expect(StaffPhotoTypes.label('mystery_type')).toBe('mystery_type');
    });
  });
});
