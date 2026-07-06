import { resolveLoadedCharacter }
  from '../../../../../../../assets/js/components/pages/controllers/BaseCharacterEditController.js';

describe('BaseCharacterEditController', function() {
  describe('resolveLoadedCharacter', function() {
    it('neither redirects nor seeds fields while the character has not loaded yet', function() {
      expect(resolveLoadedCharacter(null)).toEqual({ redirect: false, fields: null });
    });

    it('redirects when the loaded character cannot be edited', function() {
      expect(resolveLoadedCharacter({ id: 1, can_edit: false })).toEqual({
        redirect: true, fields: null,
      });
    });

    it('returns seed fields when the loaded character can be edited', function() {
      const character = {
        id: 1, name: 'Test Hero',
        role: 'Fighter',
        public_description: 'A brave hero', private_description: 'DM notes', can_edit: true,
        money: 310,
      };

      expect(resolveLoadedCharacter(character)).toEqual({
        redirect: false,
        fields: {
          name: 'Test Hero',
          role: 'Fighter',
          public_description: 'A brave hero', private_description: 'DM notes',
          money: '310',
        },
      });
    });

    it('defaults missing fields to empty strings and money to "0"', function() {
      expect(resolveLoadedCharacter({ id: 1, can_edit: true })).toEqual({
        redirect: false,
        fields: {
          name: '', role: '',
          public_description: '', private_description: '',
          money: '0',
        },
      });
    });
  });
});
