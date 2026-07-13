import TreasureController
  from '../../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasureController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/AuthStorage.js';
import AccessStore from '../../../../../../../../assets/js/utils/AccessStore.js';

describe('TreasureController', function() {
  let treasureClient;

  beforeEach(function() {
    treasureClient = jasmine.createSpyObj('treasureClient', ['fetchTreasure']);
    treasureClient.fetchTreasure.and.returnValue(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: 'Sword', value: 100 }),
    }));
    spyOn(AccessStore, 'ensureTreasurePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  it('extracts treasure id from hash', function() {
    expect(TreasureController.getTreasureIdFromHash('#/treasures/42')).toBe('42');
  });

  it('fetches treasure detail and access in parallel', async function() {
    const setTreasure = jasmine.createSpy('setTreasure');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/treasures/1' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new TreasureController(setTreasure, setLoading, setError, treasureClient)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(treasureClient.fetchTreasure).toHaveBeenCalledWith('1', null);
      expect(AccessStore.ensureTreasurePermissions).toHaveBeenCalledWith('1');
      expect(setTreasure).toHaveBeenCalledWith(
        jasmine.objectContaining({ id: 1, name: 'Sword', value: 100, can_edit: false }),
      );
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('merges can_edit from AccessStore onto the treasure', async function() {
    const setTreasure = jasmine.createSpy('setTreasure');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/treasures/1' } };
    globalThis.window = fakeWindow;

    AccessStore.ensureTreasurePermissions.and.returnValue(Promise.resolve({ can_edit: true }));

    try {
      const cleanup = new TreasureController(setTreasure, setLoading, setError, treasureClient)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTreasure).toHaveBeenCalledWith(
        jasmine.objectContaining({ can_edit: true }),
      );

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets error when the treasure fetch fails', async function() {
    const setTreasure = jasmine.createSpy('setTreasure');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/treasures/1' } };
    globalThis.window = fakeWindow;

    treasureClient.fetchTreasure.and.returnValue(Promise.resolve({ ok: false }));

    try {
      const cleanup = new TreasureController(setTreasure, setLoading, setError, treasureClient)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTreasure).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load treasure.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('sends the token when the user is authenticated', async function() {
    const setTreasure = jasmine.createSpy('setTreasure');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/treasures/1' } };
    globalThis.window = fakeWindow;

    AuthStorage.setToken('tok-abc');

    try {
      const cleanup = new TreasureController(setTreasure, setLoading, setError, treasureClient)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(treasureClient.fetchTreasure).toHaveBeenCalledWith('1', 'tok-abc');
      expect(AccessStore.ensureTreasurePermissions).toHaveBeenCalledWith('1');

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });
});
