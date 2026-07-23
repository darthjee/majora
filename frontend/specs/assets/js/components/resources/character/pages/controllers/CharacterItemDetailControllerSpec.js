import CharacterItemDetailController
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemDetailController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('CharacterItemDetailController', function() {
  let setItem;
  let setLoading;
  let setError;
  let setCanEdit;
  let setCanUploadPhoto;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setItem = jasmine.createSpy('setItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setCanEdit = jasmine.createSpy('setCanEdit');
    setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 1, name: 'Cloak of Elvenkind' } }),
    );
    spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug, character id, and item id for pcs', function() {
      expect(CharacterItemDetailController.getParamsFromHash('pcs', '#/games/demo/pcs/7/items/5')).toEqual({
        game_slug: 'demo', character_id: '7', id: '5',
      });
    });

    it('extracts the game slug, character id, and item id for npcs', function() {
      expect(CharacterItemDetailController.getParamsFromHash('npcs', '#/games/demo/npcs/9/items/3')).toEqual({
        game_slug: 'demo', character_id: '9', id: '3',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(CharacterItemDetailController.getParamsFromHash('pcs', '#/games/demo')).toEqual({
        game_slug: '', character_id: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    [
      ['pcs', '#/games/demo/pcs/7/items/5', { gameSlug: 'demo', kind: 'pcs', id: '7', itemId: '5' }],
      ['npcs', '#/games/demo/npcs/9/items/3', { gameSlug: 'demo', kind: 'npcs', id: '9', itemId: '3' }],
    ].forEach(([characterKind, hash, expectedParams]) => {
      describe(`for ${characterKind}`, function() {
        beforeEach(function() {
          client.currentHash.and.returnValue(hash);
        });

        it('fetches the item through RequestStore with the character-owned kind', async function() {
          const cleanup = new CharacterItemDetailController(
            characterKind, setItem, setLoading, setError, setCanEdit, setCanUploadPhoto, client,
          ).buildEffect()();
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(ensureSpy).toHaveBeenCalledWith({
            resource: 'item', quantityType: 'single', params: expectedParams,
          });
          expect(setItem).toHaveBeenCalledWith({ id: 1, name: 'Cloak of Elvenkind' });
          expect(setLoading).toHaveBeenCalledWith(false);
          expect(setError).not.toHaveBeenCalled();

          cleanup();
        });

        it('resolves the character-level permission for this character kind', async function() {
          const cleanup = new CharacterItemDetailController(
            characterKind, setItem, setLoading, setError, setCanEdit, setCanUploadPhoto, client,
          ).buildEffect()();
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith(
            characterKind, expectedParams.gameSlug, expectedParams.id,
          );

          cleanup();
        });
      });
    });

    it('sets an error when the fetch rejects', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/items/5');
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new CharacterItemDetailController('pcs', setItem, setLoading, setError, setCanEdit, setCanUploadPhoto, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load item.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7');

      const cleanup = new CharacterItemDetailController('pcs', setItem, setLoading, setError, setCanEdit, setCanUploadPhoto, client)
        .buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load item.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/items/5');

      const cleanup = new CharacterItemDetailController('pcs', setItem, setLoading, setError, setCanEdit, setCanUploadPhoto, client)
        .buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setItem).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });

  describe('canUploadPhoto', function() {
    beforeEach(function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/items/5');
    });

    const runController = async () => {
      const cleanup = new CharacterItemDetailController('pcs', setItem, setLoading, setError, setCanEdit, setCanUploadPhoto, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();
    };

    it('is true when the permissions response grants can_upload_item_photo', async function() {
      AccessStore.ensureCharacterPermissions.and.returnValue(
        Promise.resolve({ can_edit: false, can_upload_item_photo: true }),
      );

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is false when the permissions response denies can_upload_item_photo', async function() {
      AccessStore.ensureCharacterPermissions.and.returnValue(
        Promise.resolve({ can_edit: false, can_upload_item_photo: false }),
      );

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(false);
    });

    it('fails closed to false when the permission check rejects', async function() {
      AccessStore.ensureCharacterPermissions.and.returnValue(Promise.reject(new Error('nope')));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(false);
    });
  });

  describe('canEdit', function() {
    beforeEach(function() {
      client.currentHash.and.returnValue('#/games/demo/pcs/7/items/5');
    });

    const runController = async () => {
      const cleanup = new CharacterItemDetailController('pcs', setItem, setLoading, setError, setCanEdit, setCanUploadPhoto, client)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();
    };

    it('is true when the permissions response grants can_edit', async function() {
      AccessStore.ensureCharacterPermissions.and.returnValue(Promise.resolve({ can_edit: true }));

      await runController();

      expect(setCanEdit).toHaveBeenCalledWith(true);
    });

    it('is false when the permissions response denies can_edit', async function() {
      AccessStore.ensureCharacterPermissions.and.returnValue(Promise.resolve({ can_edit: false }));

      await runController();

      expect(setCanEdit).toHaveBeenCalledWith(false);
    });

    it('fails closed to false when the permission check rejects', async function() {
      AccessStore.ensureCharacterPermissions.and.returnValue(Promise.reject(new Error('nope')));

      await runController();

      expect(setCanEdit).toHaveBeenCalledWith(false);
    });
  });
});
