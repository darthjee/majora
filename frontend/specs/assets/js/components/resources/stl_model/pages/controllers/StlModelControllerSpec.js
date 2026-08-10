import StlModelController
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelController.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildStlModel } from '../../../../../../../support/factories.js';

describe('StlModelController', function() {
  let ensureSpy;

  beforeEach(function() {
    ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: buildStlModel({ id: 1, name: 'Goblin Miniature' }),
    }));
  });

  it('extracts STL model id from hash', function() {
    expect(StlModelController.getStlModelIdFromHash('#/miniatures/stl_models/42')).toBe('42');
  });

  it('fetches STL model detail through RequestStore', async function() {
    const setStlModel = jasmine.createSpy('setStlModel');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/miniatures/stl_models/1' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new StlModelController(setStlModel, setLoading, setError)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'StlModelController', resource: 'stlModel', quantityType: 'single', params: { id: '1' },
      });
      expect(setStlModel).toHaveBeenCalledWith(
        jasmine.objectContaining({ id: 1, name: 'Goblin Miniature' }),
      );
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(setError).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets error when the STL model fetch fails', async function() {
    const setStlModel = jasmine.createSpy('setStlModel');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/miniatures/stl_models/1' } };
    globalThis.window = fakeWindow;

    ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

    try {
      const cleanup = new StlModelController(setStlModel, setLoading, setError)
        .buildEffect()();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setStlModel).not.toHaveBeenCalled();
      expect(setError).toHaveBeenCalledWith('Unable to load STL model.');
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });

  it('sets an error and skips fetching when the hash has no STL model id', async function() {
    const setStlModel = jasmine.createSpy('setStlModel');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const fakeWindow = { location: { hash: '#/miniatures/stl_models' } };
    globalThis.window = fakeWindow;

    try {
      const cleanup = new StlModelController(setStlModel, setLoading, setError)
        .buildEffect()();

      expect(setError).toHaveBeenCalledWith('Unable to load STL model.');
      expect(setLoading).toHaveBeenCalledWith(false);
      expect(ensureSpy).not.toHaveBeenCalled();

      cleanup();
    } finally {
      delete globalThis.window;
    }
  });
});
