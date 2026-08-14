import FactionCharactersPanelController
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/controllers/FactionCharactersPanelController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('FactionCharactersPanelController', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/factions/9' } };
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

  describe('#buildEffect', function() {
    it('sets loading true before fetching', function() {
      // eslint-disable-next-line no-empty-function
      spyOn(RequestStore, 'ensure').and.returnValue(new Promise(() => {}));
      const controller = new FactionCharactersPanelController();
      const setState = jasmine.createSpy('setState');

      controller.buildEffect('demo', 9, setState)();

      const updater = setState.calls.mostRecent().args[0];
      expect(updater({
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, loading: false, error: 'x',
      })).toEqual({
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, loading: true, error: '',
      });
    });

    it('applies the fetched items/pagination on success', async function() {
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
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, loading: true, error: '',
      })).toEqual({
        items: [], pagination: { page: 1, pages: 1, perPage: 24 }, loading: false,
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
  });
});
