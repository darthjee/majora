import TreasureController
  from '../../../../../../../../assets/js/components/resources/treasure/pages/controllers/TreasureController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { stubAccessPair } from '../../../../../../../support/accessStoreStub.js';

describe('TreasureController', function() {
  let ensureSpy;

  beforeEach(function() {
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: { id: 1, name: 'Sword', value: 100 },
    }));
  });

  it('extracts treasure id from hash', function() {
    expect(TreasureController.getTreasureIdFromHash('#/treasures/42')).toBe('42');
  });

  it('fetches treasure detail through RequestStore and access in parallel', async function() {
    stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: false }, { can_edit: false });
    const setTreasure = jasmine.createSpy('setTreasure');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/treasures/1' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new TreasureController(setTreasure, setLoading, setError)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'TreasureController', resource: 'treasure', quantityType: 'single', params: { id: '1' },
      });
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

  it('renders can_edit false first, then merges the real can_edit once AccessStore resolves', async function() {
    stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: true }, { can_edit: false });
    const setTreasure = jasmine.createSpy('setTreasure');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/treasures/1' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new TreasureController(setTreasure, setLoading, setError)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setTreasure.calls.count()).toBe(2);
      expect(setTreasure.calls.argsFor(0)[0]).toEqual(
        jasmine.objectContaining({ id: 1, can_edit: false }),
      );
      expect(setTreasure.calls.argsFor(1)[0]).toEqual(
        jasmine.objectContaining({ id: 1, can_edit: true }),
      );

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets error when the treasure fetch fails', async function() {
    stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: false }, { can_edit: false });
    const setTreasure = jasmine.createSpy('setTreasure');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/treasures/1' } };
    globalThis.window = fakeWindow;

    ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

    try {
      const cleanup = new TreasureController(setTreasure, setLoading, setError)
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

  it('sets an error and skips fetching when the hash has no treasure id', async function() {
    const setTreasure = jasmine.createSpy('setTreasure');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/treasures' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new TreasureController(setTreasure, setLoading, setError)
        .buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load treasure.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });
});
