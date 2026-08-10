import SourceController
  from '../../../../../../../../assets/js/components/resources/source/pages/controllers/SourceController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildSource } from '../../../../../../../support/factories.js';

describe('SourceController', function() {
  let ensureSpy;

  beforeEach(function() {
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: buildSource({ id: 1, name: 'MyMiniFactory' }),
    }));
  });

  it('extracts source id from hash', function() {
    expect(SourceController.getSourceIdFromHash('#/miniatures/sources/42')).toBe('42');
  });

  it('fetches source detail through RequestStore', async function() {
    const setSource = jasmine.createSpy('setSource');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/miniatures/sources/1' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new SourceController(setSource, setLoading, setError)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'SourceController', resource: 'source', quantityType: 'single', params: { id: '1' },
      });
      expect(setSource).toHaveBeenCalledWith(
        jasmine.objectContaining({ id: 1, name: 'MyMiniFactory' }),
      );
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets error when the source fetch fails', async function() {
    const setSource = jasmine.createSpy('setSource');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/miniatures/sources/1' } };
    globalThis.window = fakeWindow;

    ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

    try {
      const cleanup = new SourceController(setSource, setLoading, setError)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setSource).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load source.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets an error and skips fetching when the hash has no source id', async function() {
    const setSource = jasmine.createSpy('setSource');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/miniatures/sources' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new SourceController(setSource, setLoading, setError)
        .buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load source.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });
});
