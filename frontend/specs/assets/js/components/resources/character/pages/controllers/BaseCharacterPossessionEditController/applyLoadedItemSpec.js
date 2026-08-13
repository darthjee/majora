import BaseCharacterPossessionEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterPossessionEditController.js';

describe('BaseCharacterPossessionEditController', function() {
  let setPossession;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let setters;

  beforeEach(function() {
    setPossession = jasmine.createSpy('setPossession');
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
    it('does nothing while the possession has not loaded yet', function() {
      const controller = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      );

      controller.applyLoadedItem(null, setters);

      expect(setters.setName).not.toHaveBeenCalled();
    });

    it('seeds the form fields from the loaded GamePossession', function() {
      const controller = new BaseCharacterPossessionEditController(
        'pcs', setPossession, setLoading, setError, setFieldErrors, client,
      );
      const possession = {
        id: 42, name: 'Old Tavern', description: 'Dusty', hidden: true,
      };

      controller.applyLoadedItem(possession, setters);

      expect(setters.setName).toHaveBeenCalledWith('Old Tavern');
      expect(setters.setDescription).toHaveBeenCalledWith('Dusty');
      expect(setters.setHidden).toHaveBeenCalledWith(true);
    });

    it('defaults a missing description to an empty string and hidden to false', function() {
      const controller = new BaseCharacterPossessionEditController(
        'npcs', setPossession, setLoading, setError, setFieldErrors, client,
      );
      const possession = { id: 42, name: 'Old Tavern' };

      controller.applyLoadedItem(possession, setters);

      expect(setters.setDescription).toHaveBeenCalledWith('');
      expect(setters.setHidden).toHaveBeenCalledWith(false);
    });
  });
});
