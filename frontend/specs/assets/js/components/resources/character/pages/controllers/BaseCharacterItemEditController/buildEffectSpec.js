import BaseCharacterItemEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterItemEditController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('BaseCharacterItemEditController', function() {
  let setItem;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setItem = jasmine.createSpy('setItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 1, name: 'Cloak of Elvenkind', hidden: false } }),
    );
  });

  describe('#buildEffect', function() {
    [
      ['pcs', '#/games/demo/pcs/7/items/5/edit', { gameSlug: 'demo', kind: 'pcs', id: '7', itemId: '5' }],
      ['npcs', '#/games/demo/npcs/9/items/3/edit', { gameSlug: 'demo', kind: 'npcs', id: '9', itemId: '3' }],
    ].forEach(([characterKind, hash, params]) => {
      describe(`for ${characterKind}`, function() {
        beforeEach(function() {
          client.currentHash.and.returnValue(hash);
        });

        it('fetches the item through RequestStore and sets the loaded item', async function() {
          const cleanup = new BaseCharacterItemEditController(
            characterKind, setItem, setLoading, setError, setFieldErrors, client,
          ).buildEffect()();
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(ensureSpy).toHaveBeenCalledWith({
            componentName: 'BaseCharacterItemEditController', resource: 'item', quantityType: 'single', params,
          });
          expect(setItem).toHaveBeenCalledWith({ id: 1, name: 'Cloak of Elvenkind', hidden: false });
          expect(setLoading).toHaveBeenCalledWith(false);
          expect(setError).not.toHaveBeenCalled();

          cleanup();
        });
      });
    });

    it('sets an error when the fetch rejects', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/items/5/edit');
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      ).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load item.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7');

      const cleanup = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      ).buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load item.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/items/5/edit');

      const cleanup = new BaseCharacterItemEditController(
        'pcs', setItem, setLoading, setError, setFieldErrors, client,
      ).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setItem).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
