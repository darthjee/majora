import BaseCharacterItemEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterItemEditController.js';

describe('BaseCharacterItemEditController', function() {
  let setItem;
  let setLoading;
  let setError;
  let setFieldErrors;
  let client;

  beforeEach(function() {
    setItem = jasmine.createSpy('setItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch', 'patchJson']);
  });

  describe('#buildEffect', function() {
    [
      ['pcs', '#/games/demo/pcs/7/items/5/edit', '/games/demo/pcs/7/items/5'],
      ['npcs', '#/games/demo/npcs/9/items/3/edit', '/games/demo/npcs/9/items/3'],
    ].forEach(([characterKind, hash, base]) => {
      describe(`for ${characterKind}`, function() {
        beforeEach(function() {
          client.currentHash.and.returnValue(hash);
        });

        it('fetches the elevated endpoint and sets the loaded item', async function() {
          client.fetch.and.returnValue(Promise.resolve({ id: 1, name: 'Cloak of Elvenkind', hidden: false }));

          const cleanup = new BaseCharacterItemEditController(
            characterKind, setItem, setLoading, setError, setFieldErrors, client,
          ).buildEffect()();
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(client.fetch).toHaveBeenCalledWith(`${base}/full.json`);
          expect(setItem).toHaveBeenCalledWith({ id: 1, name: 'Cloak of Elvenkind', hidden: false });
          expect(setLoading).toHaveBeenCalledWith(false);
          expect(setError).not.toHaveBeenCalled();

          cleanup();
        });
      });
    });

    it('sets an error when the fetch rejects', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/items/5/edit');
      client.fetch.and.returnValue(Promise.reject(new Error('network error')));

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
      expect(client.fetch).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/items/5/edit');
      client.fetch.and.returnValue(Promise.resolve({ id: 1, name: 'Cloak of Elvenkind' }));

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
