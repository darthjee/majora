import CollectionController
  from '../../../../../../../../assets/js/components/resources/collection/pages/controllers/CollectionController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildCollection } from '../../../../../../../support/factories.js';

describe('CollectionController', function() {
  let ensureSpy;

  beforeEach(function() {
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: buildCollection({ id: 1, name: 'Goblin Pack' }),
    }));
  });

  it('extracts collection id from hash', function() {
    expect(CollectionController.getCollectionIdFromHash('#/miniatures/collections/42')).toBe('42');
  });

  it('fetches collection detail through RequestStore', async function() {
    const setCollection = jasmine.createSpy('setCollection');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/miniatures/collections/1' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new CollectionController(setCollection, setLoading, setError)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'CollectionController', resource: 'collection', quantityType: 'single', params: { id: '1' },
      });
      expect(setCollection).toHaveBeenCalledWith(
        jasmine.objectContaining({ id: 1, name: 'Goblin Pack' }),
      );
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets error when the collection fetch fails', async function() {
    const setCollection = jasmine.createSpy('setCollection');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/miniatures/collections/1' } };
    globalThis.window = fakeWindow;

    ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

    try {
      const cleanup = new CollectionController(setCollection, setLoading, setError)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCollection).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load collection.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets an error and skips fetching when the hash has no collection id', async function() {
    const setCollection = jasmine.createSpy('setCollection');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/miniatures/collections' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new CollectionController(setCollection, setLoading, setError)
        .buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load collection.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });
});
