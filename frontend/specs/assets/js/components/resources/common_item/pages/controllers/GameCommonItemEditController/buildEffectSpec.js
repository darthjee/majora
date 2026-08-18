import GameCommonItemEditController
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemEditController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameCommonItemEditController', function() {
  let setCommonItem;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setCommonItem = jasmine.createSpy('setCommonItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
    client.currentHash.and.returnValue('#/games/demo/common_items/5/edit');
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 5, name: 'Healing Potion', hidden: false } }),
    );
  });

  describe('#buildEffect', function() {
    it('fetches the common item through RequestStore and sets the loaded common item', async function() {
      const cleanup = new GameCommonItemEditController(setCommonItem, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GameCommonItemEditController',
        resource: 'commonItem',
        quantityType: 'single',
        params: { gameSlug: 'demo', id: '5' },
      });
      expect(setCommonItem).toHaveBeenCalledWith({ id: 5, name: 'Healing Potion', hidden: false });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GameCommonItemEditController(setCommonItem, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load common item.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo');

      const cleanup = new GameCommonItemEditController(setCommonItem, setLoading, setError, setFieldErrors, client)
        .buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load common item.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      const cleanup = new GameCommonItemEditController(setCommonItem, setLoading, setError, setFieldErrors, client)
        .buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCommonItem).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
