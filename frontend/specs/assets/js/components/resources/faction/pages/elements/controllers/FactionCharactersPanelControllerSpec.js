import FactionCharactersPanelController
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelController.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('FactionCharactersPanelController', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/factions/9' } };
    spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('#fetchPage', function() {
    it('fetches through RequestStore (faction.characters) with no page/per_page when absent from the hash',
      async function() {
        const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [{ id: 1, name: 'Aragorn', type: 'pc' }], pagination: { page: 1, pages: 1, perPage: 24 },
        }));
        const controller = new FactionCharactersPanelController();

        const result = await controller.fetchPage('demo', 9);

        expect(ensureSpy).toHaveBeenCalledWith({
          componentName: 'FactionCharactersPanelController',
          resource: 'faction',
          quantityType: 'characters',
          params: { gameSlug: 'demo', id: 9 },
          query: { page: undefined, per_page: undefined },
        });
        expect(result).toEqual({
          data: [{ id: 1, name: 'Aragorn', type: 'pc' }], pagination: { page: 1, pages: 1, perPage: 24 },
        });
      });

    it('reads page/per_page from the current hash query string', async function() {
      globalThis.window.location.hash = '#/games/demo/factions/9?page=2&per_page=12';
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [], pagination: { page: 2, pages: 3, perPage: 12 },
      }));
      const controller = new FactionCharactersPanelController();

      await controller.fetchPage('demo', 9);

      expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        query: { page: '2', per_page: '12' },
      }));
    });

    it('defaults data to an empty array when RequestStore resolves a non-array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: null, pagination: { page: 1, pages: 1, perPage: 24 },
      }));
      const controller = new FactionCharactersPanelController();

      const result = await controller.fetchPage('demo', 9);

      expect(result.data).toEqual([]);
    });
  });

  describe('#isDmOrAdmin', function() {
    it('resolves true when the requester can edit the game', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_edit: true }));
      const controller = new FactionCharactersPanelController();

      expect(await controller.isDmOrAdmin('demo')).toBe(true);
      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
    });

    it('resolves false when the requester cannot edit the game', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_edit: false }));
      const controller = new FactionCharactersPanelController();

      expect(await controller.isDmOrAdmin('demo')).toBe(false);
    });

    it('fails closed to false when the permissions check rejects', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.reject(new Error('nope')));
      const controller = new FactionCharactersPanelController();

      expect(await controller.isDmOrAdmin('demo')).toBe(false);
    });
  });

  describe('#buildEffect', function() {
    it('sets loading true before fetching', function() {
      // eslint-disable-next-line no-empty-function
      spyOn(RequestStore, 'ensure').and.returnValue(new Promise(() => {}));
      const controller = new FactionCharactersPanelController();
      const setState = jasmine.createSpy('setState');

      controller.buildEffect('demo', 9, setState)();

      const updater = setState.calls.mostRecent().args[0];
      expect(updater({
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, isDmOrAdmin: false, loading: false, error: 'x',
      })).toEqual({
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, isDmOrAdmin: false, loading: true, error: '',
      });
    });

    it('applies the fetched items/pagination/isDmOrAdmin on success', async function() {
      AccessStore.ensureGamePermissions.and.returnValue(Promise.resolve({ can_edit: true }));
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Aragorn', type: 'pc' }], pagination: { page: 1, pages: 2, perPage: 24 },
      }));
      const controller = new FactionCharactersPanelController();
      const setState = jasmine.createSpy('setState');

      controller.buildEffect('demo', 9, setState)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setState).toHaveBeenCalledWith({
        items: [{ id: 1, name: 'Aragorn', type: 'pc' }],
        pagination: { page: 1, pages: 2, perPage: 24 },
        isDmOrAdmin: true,
        loading: false,
        error: '',
      });
    });

    it('sets an error when the fetch rejects', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('boom')));
      const controller = new FactionCharactersPanelController();
      const setState = jasmine.createSpy('setState');

      controller.buildEffect('demo', 9, setState)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const errorUpdater = setState.calls.mostRecent().args[0];
      expect(errorUpdater({
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, isDmOrAdmin: false, loading: true, error: '',
      })).toEqual({
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, isDmOrAdmin: false, loading: false,
        error: 'faction_page.characters_panel_error',
      });
    });

    it('does not update state after the returned cleanup is called', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [], pagination: { page: 1, pages: 1, perPage: 24 },
      }));
      const controller = new FactionCharactersPanelController();
      const setState = jasmine.createSpy('setState');

      const cleanup = controller.buildEffect('demo', 9, setState)();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setState.calls.count()).toBe(1);
    });

    it('steps back to the last page and refetches when the fetched page is past the total', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValues(
        Promise.resolve({ data: [], pagination: { page: 5, pages: 2, perPage: 24 } }),
        Promise.resolve({
          data: [{ id: 1, name: 'Aragorn', type: 'pc' }], pagination: { page: 2, pages: 2, perPage: 24 },
        }),
      );
      globalThis.window.location.hash = '#/games/demo/factions/9?page=5';
      const controller = new FactionCharactersPanelController();
      const setState = jasmine.createSpy('setState');

      controller.buildEffect('demo', 9, setState)();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(globalThis.window.location.hash).toBe('#/games/demo/factions/9?page=2');
      expect(ensureSpy).toHaveBeenCalledTimes(2);
      expect(setState).toHaveBeenCalledWith({
        items: [{ id: 1, name: 'Aragorn', type: 'pc' }],
        pagination: { page: 2, pages: 2, perPage: 24 },
        isDmOrAdmin: false,
        loading: false,
        error: '',
      });
    });
  });

  describe('#kick', function() {
    it('submits a POST through RequestStore (faction.remove) for a pc, regular variant', async function() {
      const mutateSpy = spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ status: 204 }));
      const controller = new FactionCharactersPanelController();

      const result = await controller.kick('demo', { id: 5, type: 'pc' }, 9, false);

      expect(mutateSpy).toHaveBeenCalledWith({
        componentName: 'FactionCharactersPanelController',
        resource: 'faction',
        method: 'POST',
        quantityType: 'remove',
        params: { gameSlug: 'demo', kind: 'pcs', id: 5 },
        body: { game_faction_id: 9 },
        variantName: 'regular',
      });
      expect(result).toEqual({ ok: true });
    });

    it('submits through the private variant for an npc when isDmOrAdmin is true', async function() {
      const mutateSpy = spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ status: 204 }));
      const controller = new FactionCharactersPanelController();

      await controller.kick('demo', { id: 8, type: 'npc' }, 9, true);

      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        params: { gameSlug: 'demo', kind: 'npcs', id: 8 },
        variantName: 'private',
      }));
    });

    it('resolves a generic error when the response is not a 204', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ status: 404 }));
      const controller = new FactionCharactersPanelController();

      const result = await controller.kick('demo', { id: 5, type: 'pc' }, 9, false);

      expect(result).toEqual({ ok: false, errorKey: 'faction_exchange_modal.generic_error' });
    });
  });

  describe('#confirmKick', function() {
    const buildSetters = () => ({
      setSubmitting: jasmine.createSpy('setSubmitting'),
      setError: jasmine.createSpy('setError'),
      onSuccess: jasmine.createSpy('onSuccess'),
    });

    it('sets submitting, purges the faction cache, and calls onSuccess on success', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ status: 204 }));
      const purgeSpy = spyOn(RequestStore, 'purge');
      const controller = new FactionCharactersPanelController();
      const setters = buildSetters();

      await controller.confirmKick({ id: 5, type: 'pc' }, 'demo', 9, false, setters);

      expect(setters.setSubmitting).toHaveBeenCalledWith(true);
      expect(setters.setSubmitting).toHaveBeenCalledWith(false);
      expect(purgeSpy).toHaveBeenCalledWith({ resource: 'faction' });
      expect(setters.setError).toHaveBeenCalledWith('');
      expect(setters.onSuccess).toHaveBeenCalled();
    });

    it('sets the error key and does not purge or call onSuccess on failure', async function() {
      spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({ status: 404 }));
      const purgeSpy = spyOn(RequestStore, 'purge');
      const controller = new FactionCharactersPanelController();
      const setters = buildSetters();

      await controller.confirmKick({ id: 5, type: 'pc' }, 'demo', 9, false, setters);

      expect(setters.setError).toHaveBeenCalledWith('faction_exchange_modal.generic_error');
      expect(purgeSpy).not.toHaveBeenCalled();
      expect(setters.onSuccess).not.toHaveBeenCalled();
    });
  });
});
