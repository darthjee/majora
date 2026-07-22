import BaseCharacterItemEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterItemEditController.js';

describe('BaseCharacterItemEditController', function() {
  let setItem;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let setters;

  beforeEach(function() {
    setItem = jasmine.createSpy('setItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
    setters = {
      setName: jasmine.createSpy('setName'),
      setDescription: jasmine.createSpy('setDescription'),
      setHidden: jasmine.createSpy('setHidden'),
    };
  });

  describe('#applyLoadedItem', function() {
    it('does nothing while the item has not loaded yet', function() {
      const controller = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      );

      controller.applyLoadedItem(null, setters);

      expect(setters.setName).not.toHaveBeenCalled();
    });

    it('seeds the form fields from the loaded item', function() {
      const controller = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      );
      const item = { id: 1, name: 'Cloak of Elvenkind', description: 'Shiny', hidden: true };

      controller.applyLoadedItem(item, setters);

      expect(setters.setName).toHaveBeenCalledWith('Cloak of Elvenkind');
      expect(setters.setDescription).toHaveBeenCalledWith('Shiny');
      expect(setters.setHidden).toHaveBeenCalledWith(true);
    });

    it('defaults a missing description to an empty string and hidden to false', function() {
      const controller = new BaseCharacterItemEditController(
        'npcs', setItem, setLoading, setError, setFieldErrors, client,
      );
      const item = { id: 1, name: 'Cloak of Elvenkind' };

      controller.applyLoadedItem(item, setters);

      expect(setters.setDescription).toHaveBeenCalledWith('');
      expect(setters.setHidden).toHaveBeenCalledWith(false);
    });
  });
});
