import GameNpcsController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/GameNpcsController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('GameNpcsController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('canEdit', function() {
    const buildController = (setCanEdit) => {
      const setNpcs = jasmine.createSpy('setNpcs');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue('#/games/demo/npcs');
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [],
        pagination: { page: 1, pages: 1, perPage: 10 },
      }));

      return new GameNpcsController(
        setNpcs, setPagination, setLoading, setError, client, null, setCanEdit,
      );
    };

    it('sets canEdit to true when the game permissions response allows editing', async function() {
      const setCanEdit = jasmine.createSpy('setCanEdit');

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      const cleanup = buildController(setCanEdit).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      expect(setCanEdit).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('sets canEdit to false when the permissions resolve with the fail-closed default', async function() {
      const setCanEdit = jasmine.createSpy('setCanEdit');

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

      const cleanup = buildController(setCanEdit).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanEdit).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets canEdit to false when the access request throws', async function() {
      const setCanEdit = jasmine.createSpy('setCanEdit');

      spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.reject(new Error('network error')));
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController(setCanEdit).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanEdit).toHaveBeenCalledWith(false);

      cleanup();
    });
  });
});
