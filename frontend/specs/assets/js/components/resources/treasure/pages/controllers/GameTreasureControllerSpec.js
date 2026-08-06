import GameTreasureController
  from '../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasureController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { stubAccessPair } from '../../../../../../../support/accessStoreStub.js';
import { buildTreasure } from '../../../../../../../support/factories.js';

describe('GameTreasureController', function() {
  let ensureSpy;

  beforeEach(function() {
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: buildTreasure({
        id: 1, name: 'Sword', value: 100, game_slug: 'demo',
      }),
    }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
  });

  describe('.getParamsFromHash', function() {
    it('extracts the game slug and treasure id', function() {
      expect(GameTreasureController.getParamsFromHash('#/games/demo/treasures/5')).toEqual({
        game_slug: 'demo', treasure_id: '5',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(GameTreasureController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', treasure_id: '',
      });
    });
  });

  describe('#buildEffect', function() {
    it('fetches the game-scoped treasure through RequestStore and access in parallel', async function() {
      stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: false }, { can_edit: false });
      const setTreasure = jasmine.createSpy('setTreasure');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');
      globalThis.window = { location: { hash: '#/games/demo/treasures/1' } };

      try {
        const cleanup = new GameTreasureController(setTreasure, setLoading, setError, setCanUploadPhoto).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(ensureSpy).toHaveBeenCalledWith({
          componentName: 'GameTreasureController',
          resource: 'treasure',
          quantityType: 'single',
          params: { gameSlug: 'demo', id: '1' },
        });
        expect(AccessStore.ensureTreasurePermissions).toHaveBeenCalledWith('1', true);
        expect(setTreasure).toHaveBeenCalledWith(
          jasmine.objectContaining({
            id: 1, name: 'Sword', value: 100, can_edit: false,
          }),
        );
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(setError).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('renders can_edit false first, then merges the real can_edit once AccessStore resolves', async function() {
      stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: true }, { can_edit: false });
      const setTreasure = jasmine.createSpy('setTreasure');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');
      globalThis.window = { location: { hash: '#/games/demo/treasures/1' } };

      try {
        const cleanup = new GameTreasureController(setTreasure, setLoading, setError, setCanUploadPhoto).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setTreasure.calls.count()).toBe(2);
        expect(setTreasure.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ id: 1, can_edit: false }));
        expect(setTreasure.calls.argsFor(1)[0]).toEqual(jasmine.objectContaining({ id: 1, can_edit: true }));

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets an error when the treasure fetch fails', async function() {
      stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: false }, { can_edit: false });
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));
      const setTreasure = jasmine.createSpy('setTreasure');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');
      globalThis.window = { location: { hash: '#/games/demo/treasures/1' } };

      try {
        const cleanup = new GameTreasureController(setTreasure, setLoading, setError, setCanUploadPhoto).buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setTreasure).not.toHaveBeenCalled();
        expect(setError).toHaveBeenCalledWith('Unable to load treasure.');
        expect(setLoading).toHaveBeenCalledWith(false);

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('sets an error and skips fetching when route params are missing', function() {
      const setTreasure = jasmine.createSpy('setTreasure');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');
      globalThis.window = { location: { hash: '#/games/demo/treasures' } };

      try {
        const cleanup = new GameTreasureController(setTreasure, setLoading, setError, setCanUploadPhoto).buildEffect()();

        expect(setError).toHaveBeenCalledWith('Unable to load treasure.');
        expect(setLoading).toHaveBeenCalledWith(false);
        expect(ensureSpy).not.toHaveBeenCalled();

        cleanup();
      } finally {
        delete globalThis.window;
      }
    });

    it('does not update state after unmount', async function() {
      stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: false }, { can_edit: false });
      const setTreasure = jasmine.createSpy('setTreasure');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      const setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');
      globalThis.window = { location: { hash: '#/games/demo/treasures/1' } };

      try {
        const cleanup = new GameTreasureController(setTreasure, setLoading, setError, setCanUploadPhoto).buildEffect()();
        cleanup();
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(setTreasure).not.toHaveBeenCalled();
        expect(setLoading).not.toHaveBeenCalled();
      } finally {
        delete globalThis.window;
      }
    });
  });

  describe('canUploadPhoto (issue #1005)', function() {
    const runController = async (setCanUploadPhoto) => {
      stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: false }, { can_edit: false });
      const setTreasure = jasmine.createSpy('setTreasure');
      const setLoading = jasmine.createSpy('setLoading');
      const setError = jasmine.createSpy('setError');
      globalThis.window = { location: { hash: '#/games/demo/treasures/1' } };

      try {
        const cleanup = new GameTreasureController(setTreasure, setLoading, setError, setCanUploadPhoto)
          .buildEffect()();
        await new Promise((resolve) => setTimeout(resolve, 0));
        cleanup();
      } finally {
        delete globalThis.window;
      }
    };

    it('calls ensureGameAccess with the game slug independently of the treasure fetch', async function() {
      const setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');

      await runController(setCanUploadPhoto);

      expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
    });

    it('is true for a superuser', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_superuser: true }));
      const setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');

      await runController(setCanUploadPhoto);

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is true for a player', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_player: true }));
      const setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');

      await runController(setCanUploadPhoto);

      expect(setCanUploadPhoto).toHaveBeenCalledWith(true);
    });

    it('is false for an unrelated authenticated user', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({
        is_superuser: false, is_staff: false, is_dm: false, is_player: false,
      }));
      const setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');

      await runController(setCanUploadPhoto);

      expect(setCanUploadPhoto).toHaveBeenCalledWith(false);
    });

    it('fails closed to false when the access check rejects', async function() {
      AccessStore.ensureGameAccess.and.returnValue(Promise.reject(new Error('nope')));
      const setCanUploadPhoto = jasmine.createSpy('setCanUploadPhoto');

      await runController(setCanUploadPhoto);

      expect(setCanUploadPhoto).toHaveBeenCalledWith(false);
    });
  });
});
