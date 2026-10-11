import StaffCopiesController from '../../../../../../../../../assets/js/components/resources/staff_copy/pages/controllers/StaffCopiesController.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import {
  buildSetters, stubAccessStore, flush, GAMES, PAGINATION,
} from './support.js';

describe('StaffCopiesController', function() {
  let setters;
  let ensureSpy;
  let originalWindow;

  /**
   * @description Routes the index/games/collection ensure calls to the given results.
   * @param {object} results - Responses keyed by quantity type.
   * @returns {void}
   */
  function stubEnsure(results) {
    ensureSpy.and.callFake(({ quantityType }) => results[quantityType]);
  }

  /**
   * @description Stubs successful index/games/collection responses.
   * @param {string[]} types - Copy types returned by the index.
   * @returns {void}
   */
  function stubLoaded(types = ['items', 'factions']) {
    stubEnsure({
      index: Promise.resolve({ data: { types } }),
      games: Promise.resolve({ data: GAMES }),
      collection: Promise.resolve({ data: [{ id: 1, name: 'Sword' }], pagination: PAGINATION }),
    });
  }

  /**
   * @description Mounts a controller on the given hash and lets the load finish.
   * @param {string} hash - The window location hash.
   * @returns {Promise<Function>} the effect cleanup.
   */
  async function mount(hash) {
    globalThis.window = { location: { hash } };

    const cleanup = new StaffCopiesController(setters).buildEffect()();
    await flush();

    return cleanup;
  }

  beforeEach(function() {
    setters = buildSetters();
    ensureSpy = spyOn(RequestStore, 'ensure');
    originalWindow = globalThis.window;
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  describe('#buildEffect', function() {
    describe('staff gate', function() {
      it('redirects to home and does not fetch when the user is not staff', async function() {
        stubAccessStore(false);

        const cleanup = await mount('');

        expect(globalThis.window.location.hash).toBe('/');
        expect(ensureSpy).not.toHaveBeenCalled();

        cleanup();
      });

      it('ignores the access result after unmount', async function() {
        stubAccessStore(true);
        globalThis.window = { location: { hash: '' } };

        const cleanup = new StaffCopiesController(setters).buildEffect()();
        cleanup();
        await flush();

        expect(ensureSpy).not.toHaveBeenCalled();
      });
    });

    describe('when the user is staff', function() {
      beforeEach(function() {
        stubAccessStore(true);
      });

      it('loads the types index and the games in parallel', async function() {
        stubEnsure({ index: new Promise(Noop.noop), games: new Promise(Noop.noop) });

        const cleanup = await mount('#/staff/copies');

        expect(ensureSpy).toHaveBeenCalledWith({
          componentName: 'StaffCopiesController', resource: 'staffCopy', quantityType: 'index',
        });
        expect(ensureSpy).toHaveBeenCalledWith({
          componentName: 'StaffCopiesController', resource: 'staffCopy', quantityType: 'games',
        });

        cleanup();
      });

      it('stores types, games and the URL selection, then fetches the list', async function() {
        stubLoaded();

        const cleanup = await mount(
          '#/staff/copies?type=factions&from=source-game&to=target-game&page=2&per_page=5',
        );

        expect(setters.setTypes).toHaveBeenCalledWith(['items', 'factions']);
        expect(setters.setGames).toHaveBeenCalledWith(GAMES);
        expect(setters.setSelection).toHaveBeenCalledWith(
          { type: 'factions', from: 'source-game', to: 'target-game' },
        );
        expect(ensureSpy).toHaveBeenCalledWith({
          componentName: 'StaffCopiesController',
          resource: 'staffCopy',
          quantityType: 'collection',
          params: { copyType: 'factions' },
          query: { from: 'source-game', to: 'target-game', page: '2', per_page: '5' },
        });
        expect(setters.setRows).toHaveBeenCalledWith([{ id: 1, name: 'Sword' }]);
        expect(setters.setPagination).toHaveBeenCalledWith(PAGINATION);
        expect(setters.setLoading).toHaveBeenCalledWith(false);

        cleanup();
      });

      it('defaults the type to the first one when none is requested', async function() {
        stubLoaded();

        const cleanup = await mount('#/staff/copies?from=source-game&to=target-game');

        expect(setters.setSelection).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'items' }));

        cleanup();
      });

      it('falls back to the first type when the requested type is stale', async function() {
        stubLoaded();

        const cleanup = await mount('#/staff/copies?type=mystery&from=source-game&to=target-game');

        expect(setters.setSelection).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'items' }));
        expect(ensureSpy).toHaveBeenCalledWith(jasmine.objectContaining({ params: { copyType: 'items' } }));

        cleanup();
      });

      it('skips the list fetch until both games are selected', async function() {
        stubLoaded();

        const cleanup = await mount('#/staff/copies?from=source-game');

        expect(setters.setSelection).toHaveBeenCalledWith({ type: 'items', from: 'source-game', to: '' });
        expect(ensureSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({ quantityType: 'collection' }));
        expect(setters.setLoading).toHaveBeenCalledWith(false);

        cleanup();
      });

      it('drops a game slug that is not in the games list', async function() {
        stubLoaded();

        const cleanup = await mount('#/staff/copies?from=gone&to=target-game');

        expect(setters.setSelection).toHaveBeenCalledWith({ type: 'items', from: '', to: 'target-game' });

        cleanup();
      });

      it('rejects the same game as source and target without fetching the list', async function() {
        stubLoaded();

        const cleanup = await mount('#/staff/copies?from=source-game&to=source-game');

        expect(setters.setListError).toHaveBeenCalledWith('staff_copies_page.same_game_error');
        expect(ensureSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({ quantityType: 'collection' }));
        expect(setters.setLoading).toHaveBeenCalledWith(false);

        cleanup();
      });

      it('stores no types and skips the list fetch when the index is empty', async function() {
        stubLoaded([]);

        const cleanup = await mount('#/staff/copies?from=source-game&to=target-game');

        expect(setters.setTypes).toHaveBeenCalledWith([]);
        expect(setters.setGames).toHaveBeenCalledWith(GAMES);
        expect(setters.setSelection).toHaveBeenCalledWith(jasmine.objectContaining({ type: '' }));
        expect(ensureSpy).not.toHaveBeenCalledWith(jasmine.objectContaining({ quantityType: 'collection' }));
        expect(setters.setLoading).toHaveBeenCalledWith(false);

        cleanup();
      });

      it('treats null bodies as no types and no games', async function() {
        stubEnsure({
          index: Promise.resolve({ data: null }),
          games: Promise.resolve({ data: null }),
        });

        const cleanup = await mount('#/staff/copies');

        expect(setters.setTypes).toHaveBeenCalledWith([]);
        expect(setters.setGames).toHaveBeenCalledWith([]);

        cleanup();
      });

      it('sets the load error when the index or games fetch fails', async function() {
        stubEnsure({
          index: Promise.resolve({ data: { types: ['items'] } }),
          games: Promise.reject(new Error('boom')),
        });

        const cleanup = await mount('#/staff/copies');

        expect(setters.setError).toHaveBeenCalledWith('staff_copies_page.error');
        expect(setters.setLoading).toHaveBeenCalledWith(false);

        cleanup();
      });

      it('ignores results landing after unmount', async function() {
        let resolveIndex;
        stubEnsure({
          index: new Promise((resolve) => { resolveIndex = resolve; }),
          games: Promise.resolve({ data: GAMES }),
        });

        const cleanup = await mount('#/staff/copies');
        cleanup();
        resolveIndex({ data: { types: ['items'] } });
        await flush();

        expect(setters.setTypes).not.toHaveBeenCalled();
      });
    });
  });
});
