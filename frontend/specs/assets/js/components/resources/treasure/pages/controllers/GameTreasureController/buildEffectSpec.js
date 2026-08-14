import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { stubAccessPair } from '../../../../../../../../support/accessStoreStub.js';
import { buildTreasure } from '../../../../../../../../support/factories.js';
import { buildController, buildSetters, runController } from './support.js';

describe('GameTreasureController#buildEffect', function() {
  let ensureSpy;

  beforeEach(function() {
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: buildTreasure({
        id: 1, name: 'Sword', value: 100, game_slug: 'demo',
      }),
    }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
  });

  it('fetches the game-scoped treasure through RequestStore and access in parallel', async function() {
    stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: false }, { can_edit: false });
    const setters = buildSetters();

    await runController('#/games/demo/treasures/1', setters);

    expect(ensureSpy).toHaveBeenCalledWith({
      componentName: 'GameTreasureController',
      resource: 'treasure',
      quantityType: 'single',
      params: { gameSlug: 'demo', id: '1' },
    });
    expect(AccessStore.ensureTreasurePermissions).toHaveBeenCalledWith('1', true);
    expect(setters.setTreasure).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 1, name: 'Sword', value: 100, can_edit: false,
      }),
    );
    expect(setters.setLoading).toHaveBeenCalledWith(false);
    expect(setters.setError).not.toHaveBeenCalled();
  });

  it('renders can_edit false first, then merges the real can_edit once AccessStore resolves', async function() {
    stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: true }, { can_edit: false });
    const setters = buildSetters();

    await runController('#/games/demo/treasures/1', setters);

    expect(setters.setTreasure.calls.count()).toBe(2);
    expect(setters.setTreasure.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ id: 1, can_edit: false }));
    expect(setters.setTreasure.calls.argsFor(1)[0]).toEqual(jasmine.objectContaining({ id: 1, can_edit: true }));
  });

  it('sets an error when the treasure fetch fails', async function() {
    stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: false }, { can_edit: false });
    ensureSpy.and.returnValue(Promise.reject(new Error('network error')));
    const setters = buildSetters();

    await runController('#/games/demo/treasures/1', setters);

    expect(setters.setTreasure).not.toHaveBeenCalled();
    expect(setters.setError).toHaveBeenCalledWith('Unable to load treasure.');
    expect(setters.setLoading).toHaveBeenCalledWith(false);
  });

  it('sets an error and skips fetching when route params are missing', function() {
    const setters = buildSetters();
    globalThis.window = { location: { hash: '#/games/demo/treasures' } };

    try {
      const cleanup = buildController(setters).buildEffect()();

      expect(setters.setError).toHaveBeenCalledWith('Unable to load treasure.');
      expect(setters.setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('does not update state after unmount', async function() {
    stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: false }, { can_edit: false });
    const setters = buildSetters();
    globalThis.window = { location: { hash: '#/games/demo/treasures/1' } };

    try {
      const cleanup = buildController(setters).buildEffect()();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setters.setTreasure).not.toHaveBeenCalled();
      expect(setters.setLoading).not.toHaveBeenCalled();
    } finally {
      delete globalThis.window;
    }
  });
});
