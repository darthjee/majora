import GameItemController
  from '../../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemController.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('GameItemController', function() {
  let setItem;
  let setLoading;
  let setError;
  let setCanEdit;
  let setCanUploadPhoto;
  let setCanGiveHidden;
  let client;
  let ensureSpy;

  beforeEach(function() {
    setItem = jasmine.createSpy('setItem');
    setLoading = jasmine.createSpy('setLoading');
    setError = jasmine.createSpy('setError');
    setCanEdit = jasmine.createSpy('setCanEdit');
    setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');
    setCanGiveHidden = jasmine.createSpy('setCanGiveHidden');
    client = jasmine.createSpyObj('client', ['currentHash', 'fetch']);
    client.currentHash.and.returnValue('#/games/demo/items/5');
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
    spyOn(AccessStore, 'ensureItemPermissions').and.returnValue(Promise.resolve({ can_edit: false }));
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: { id: 5, name: 'Cloak of Elvenkind' } }),
    );
  });

  const buildController = () => new GameItemController(
    setItem, setLoading, setError, setCanEdit, setCanUploadPhoto, setCanGiveHidden, client,
  );

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
    it('fetches the item through RequestStore with the game-owned kind', async function() {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'GameItemController',
        resource: 'item',
        quantityType: 'single',
        params: { gameSlug: 'demo', kind: 'game', id: '5' },
      });
      expect(setItem).toHaveBeenCalledWith({ id: 5, name: 'Cloak of Elvenkind' });
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    });

    it('sets an error when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setError).toHaveBeenCalledWith('Unable to load item.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets an error and skips fetching when route params are missing', function() {
      client.currentHash.and.returnValue('#/games/demo');

      const cleanup = buildController().buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load item.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    });

    it('does not update state after unmount', async function() {
      const cleanup = buildController().buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setItem).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });

  describe('canUploadPhoto', function() {
    const runController = async () => {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();
    };

    it('calls ensureGameAccess with the game slug independently of the item fetch', async function() {
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

  describe('canGiveHidden (issue #833)', function() {
    const runController = async () => {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();
    };

    it('derives from the same ensureGameAccess call as canUploadPhoto', async function() {
      await runController();

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledTimes(1);
      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
    });

    it('is true for a superuser', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_superuser: true }));

      await runController();

      expect(setCanGiveHidden).toHaveBeenCalledWith(true);
    });

    it('is false for staff', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_staff: true }));

      await runController();

      expect(setCanGiveHidden).toHaveBeenCalledWith(false);
    });

    it('is true for the game DM', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_dm: true }));

      await runController();

      expect(setCanGiveHidden).toHaveBeenCalledWith(true);
    });

    it('is false for a mere player', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_player: true }));

      await runController();

      expect(setCanGiveHidden).toHaveBeenCalledWith(false);
    });

    it('is false for an unrelated authenticated user', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({
        is_superuser: false, is_staff: false, is_dm: false, is_player: false,
      }));

      await runController();

      expect(setCanGiveHidden).toHaveBeenCalledWith(false);
    });

    it('fails closed to false when the access check rejects', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.reject(new Error('nope')));

      await runController();

      expect(setCanGiveHidden).toHaveBeenCalledWith(false);
    });
  });

  describe('canEdit', function() {
    const runController = async () => {
      const cleanup = buildController().buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));
      cleanup();
    };

    it('calls ensureItemPermissions with the game slug independently of the item fetch', async function() {
      await runController();

      expect(AccessStore.ensureItemPermissions).toHaveBeenCalledWith('demo');
    });

    it('is true when the requester can edit the game', async function() {
      AccessStore.ensureItemPermissions.and.returnValue(Promise.resolve({ can_edit: true }));

      await runController();

      expect(setCanEdit).toHaveBeenCalledWith(true);
    });

    it('is false when the requester cannot edit the game', async function() {
      AccessStore.ensureItemPermissions.and.returnValue(Promise.resolve({ can_edit: false }));

      await runController();

      expect(setCanEdit).toHaveBeenCalledWith(false);
    });

    it('fails closed to false when the permissions check rejects', async function() {
      AccessStore.ensureItemPermissions.and.returnValue(Promise.reject(new Error('nope')));

      await runController();

      expect(setCanEdit).toHaveBeenCalledWith(false);
    });
  });
});
