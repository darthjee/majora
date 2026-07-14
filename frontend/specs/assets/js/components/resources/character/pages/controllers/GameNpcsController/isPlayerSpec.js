import GameNpcsController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcsController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameNpcsController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('isPlayer', function() {
    const buildController = (setIsPlayer) => {
      const setNpcs = jasmine.createSpy('setNpcs');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const setCanEdit = jasmine.createSpy('setCanEdit');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue('#/games/demo/npcs');
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [],
        pagination: { page: 1, pages: 1, perPage: 10 },
      }));

      return new GameNpcsController(
        setNpcs, setPagination, setLoading, setError, client, null, setCanEdit, setIsPlayer,
      );
    };

    it('sets isPlayer to true when the game access response reports is_player', async function() {
      const setIsPlayer = jasmine.createSpy('setIsPlayer');

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: true }));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = buildController(setIsPlayer).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
      expect(setIsPlayer).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('sets isPlayer to false when the access resolves without is_player', async function() {
      const setIsPlayer = jasmine.createSpy('setIsPlayer');

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({ is_player: false }));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = buildController(setIsPlayer).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setIsPlayer).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets isPlayer to false when the access request throws', async function() {
      const setIsPlayer = jasmine.createSpy('setIsPlayer');

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController(setIsPlayer).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setIsPlayer).toHaveBeenCalledWith(false);

      cleanup();
    });
  });
});
