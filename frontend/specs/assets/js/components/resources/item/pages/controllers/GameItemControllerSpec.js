import GameItemController
  from '../../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameItemController', function() {
  let setItem;
  let setLoading;
  let setError;
  let setCanUploadPhoto;
  let client;

  beforeEach(function() {
    setItem = jasmine.createSpy('setItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
    client.currentHash.and.returnValue('#/games/demo/items/5');
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug and item id', function() {
      expect(GameItemController.getParamsFromHash('#/games/demo/items/5')).toEqual({
        game_slug: 'demo', id: '5',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(GameItemController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('fetches the player-facing endpoint when the requester cannot edit', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      client.fetch.and.returnValue(Promise.resolve({ id: 5, name: 'Cloak of Elvenkind' }));

      const cleanup = new GameItemController(setItem, setLoading, setError, setCanUploadPhoto, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      expect(client.fetch).toHaveBeenCalledWith('/games/demo/items/5.json');
      expect(setItem).toHaveBeenCalledWith({ id: 5, name: 'Cloak of Elvenkind' });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('fetches the elevated endpoint when the requester can edit', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      client.fetch.and.returnValue(Promise.resolve({ id: 5, name: 'Cloak of Elvenkind', hidden: true }));

      const cleanup = new GameItemController(setItem, setLoading, setError, setCanUploadPhoto, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetch).toHaveBeenCalledWith('/games/demo/items/5/all.json');
      expect(setItem).toHaveBeenCalledWith({ id: 5, name: 'Cloak of Elvenkind', hidden: true });

      cleanup();
    });

    it('fails closed to the player-facing endpoint when the permission check rejects', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));
      client.fetch.and.returnValue(Promise.resolve({ id: 5, name: 'Cloak of Elvenkind' }));

      const cleanup = new GameItemController(setItem, setLoading, setError, setCanUploadPhoto, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(client.fetch).toHaveBeenCalledWith('/games/demo/items/5.json');

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      client.fetch.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new GameItemController(setItem, setLoading, setError, setCanUploadPhoto, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load item.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo');

      const cleanup = new GameItemController(setItem, setLoading, setError, setCanUploadPhoto, client).buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load item.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(client.fetch).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      client.fetch.and.returnValue(Promise.resolve({ id: 5, name: 'Cloak of Elvenkind' }));

      const cleanup = new GameItemController(setItem, setLoading, setError, setCanUploadPhoto, client).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setItem).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });

  describe('canUploadPhoto', function() {
    beforeEach(function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      client.fetch.and.returnValue(Promise.resolve({ id: 5, name: 'Cloak of Elvenkind' }));
    });

    const runController = async () => {
      const cleanup = new GameItemController(setItem, setLoading, setError, setCanUploadPhoto, client).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();
    };

    it('calls ensureGameAccess with the game slug independently of ensureGamePermissions', async function() {
      await runController();

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
    });

    it('is true for a superuser', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_superuser: true }));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is true for staff', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_staff: true }));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is true for the game DM', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_dm: true }));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is true for a player', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_player: true }));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is false for an unrelated authenticated user', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({
        is_superuser: false, is_staff: false, is_dm: false, is_player: false,
      }));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(false);
    });

    it('fails closed to false when the access check rejects', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.reject(new Error('nope')));

      await runController();

      expect(setCanUploadPhoto).toHaveBeenCalledWith(false);
    });
  });
});
