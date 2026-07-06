import GameTreasuresController
  from '../../../../../../../assets/js/components/pages/controllers/GameTreasuresController.js';
import AuthStorage from '../../../../../../../assets/js/utils/AuthStorage.js';

describe('GameTreasuresController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('canEdit', function() {
    const buildController = (setCanEdit, gameClient) => {
      const setTreasures = jasmine.createSpy('setTreasures');
      const setPagination = jasmine.createSpy('setPagination');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const client = jasmine.createSpyObj('client', ['currentHash', 'fetchIndex']);

      client.currentHash.and.returnValue('#/games/demo/treasures');
      client.fetchIndex.and.returnValue(Promise.resolve({
        data: [],
        pagination: { page: 1, pages: 1, perPage: 10 },
      }));

      return new GameTreasuresController(
        setTreasures, setPagination, setLoading, setError, client, setCanEdit, gameClient,
      );
    };

    it('sets canEdit to true when the game access response allows editing', async function() {
      const setCanEdit = jasmine.createSpy('setCanEdit');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ can_edit: true }),
      }));

      const cleanup = buildController(setCanEdit, gameClient).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(gameClient.fetchGameAccess).toHaveBeenCalledWith('demo', null);
      expect(setCanEdit).toHaveBeenCalledWith(true);

      cleanup();
    });

    it('sets canEdit to false when the access response is not ok', async function() {
      const setCanEdit = jasmine.createSpy('setCanEdit');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

      gameClient.fetchGameAccess.and.returnValue(Promise.resolve({ ok: false }));

      const cleanup = buildController(setCanEdit, gameClient).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanEdit).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('sets canEdit to false when the access request throws', async function() {
      const setCanEdit = jasmine.createSpy('setCanEdit');
      const gameClient = jasmine.createSpyObj('gameClient', ['fetchGameAccess']);

      gameClient.fetchGameAccess.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = buildController(setCanEdit, gameClient).buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCanEdit).toHaveBeenCalledWith(false);

      cleanup();
    });
  });
});
