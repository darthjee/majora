import GameCommonItemEditController
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemEditController.js';

describe('GameCommonItemEditController', function() {
  let setCommonItem;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;

  beforeEach(function() {
    setCommonItem = jasmine.createSpy('setCommonItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
  });

  describe('#applyLoadedItem', function() {
    let setters;

    beforeEach(function() {
      setters = {
        setName: jasmine.createSpy('setName'),
        setDescription: jasmine.createSpy('setDescription'),
        setPrice: jasmine.createSpy('setPrice'),
        setCategory: jasmine.createSpy('setCategory'),
        setHidden: jasmine.createSpy('setHidden'),
      };
    });

    it('does nothing while the common item has not loaded yet', function() {
      const controller = new GameCommonItemEditController(
        setCommonItem, setLoading, setError, setFieldErrors, client,
      );

      controller.applyLoadedItem(null, setters);

      expect(setters.setName).not.toHaveBeenCalled();
    });

    it('seeds the form fields from the loaded common item', function() {
      const controller = new GameCommonItemEditController(
        setCommonItem, setLoading, setError, setFieldErrors, client,
      );
      const commonItem = {
        id: 5, name: 'Healing Potion', description: 'Heals wounds', price: 500, category: 'potion', hidden: true,
      };

      controller.applyLoadedItem(commonItem, setters);

      expect(setters.setName).toHaveBeenCalledWith('Healing Potion');
      expect(setters.setDescription).toHaveBeenCalledWith('Heals wounds');
      expect(setters.setPrice).toHaveBeenCalledWith('500');
      expect(setters.setCategory).toHaveBeenCalledWith('potion');
      expect(setters.setHidden).toHaveBeenCalledWith(true);
    });

    it('defaults missing fields to empty/other/false', function() {
      const controller = new GameCommonItemEditController(
        setCommonItem, setLoading, setError, setFieldErrors, client,
      );
      const commonItem = { id: 5, name: 'Healing Potion' };

      controller.applyLoadedItem(commonItem, setters);

      expect(setters.setDescription).toHaveBeenCalledWith('');
      expect(setters.setPrice).toHaveBeenCalledWith('');
      expect(setters.setCategory).toHaveBeenCalledWith('other');
      expect(setters.setHidden).toHaveBeenCalledWith(false);
    });
  });
});
